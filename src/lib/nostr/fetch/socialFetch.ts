import { SimplePool, type Filter } from "nostr-tools";
import { SocialActivity, NOSTR_KINDS, Book, Post } from "../types";
import { getUserRelays } from "../relay";
import { getCurrentUser } from "../user";
import { fetchFollowingList } from "./profileFetch";
import { extractISBNFromTags, extractRatingFromTags } from "../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { fetchUserProfiles } from "../profile";

/**
 * Fetch social activity from people you follow
 */
export async function fetchSocialFeed(limit = 20): Promise<SocialActivity[]> {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.log("Cannot fetch social feed: User not logged in");
    return [];
  }
  
  // First, get the list of people the user follows
  const { follows } = await fetchFollowingList(currentUser.pubkey);
  
  if (follows.length === 0) {
    console.log("User doesn't follow anyone yet");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    // Fetch book-related events from followed users
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING, 
        NOSTR_KINDS.BOOK_READ,
        NOSTR_KINDS.BOOK_RATING,
        NOSTR_KINDS.REVIEW,
        NOSTR_KINDS.TEXT_NOTE
      ],
      authors: follows,
      limit
    };
    
    // Add filters for k=isbn and t=bookstr for TEXT_NOTE kind
    const textNoteFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      authors: follows,
      "#t": ["bookstr"],
      limit
    };
    
    const isbnFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      authors: follows,
      "#k": ["isbn"],
      limit
    };
    
    // Execute all queries in parallel
    const [events, textNoteEvents, isbnEvents] = await Promise.all([
      pool.querySync(relays, filter),
      pool.querySync(relays, textNoteFilter),
      pool.querySync(relays, isbnFilter)
    ]);
    
    // Combine events, removing duplicates
    const eventMap = new Map();
    
    // Add all events to the map, using the event ID as the key
    [...events, ...textNoteEvents, ...isbnEvents].forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Convert back to array
    const allEvents = Array.from(eventMap.values());
    
    // Get all unique pubkeys to fetch profiles
    const uniquePubkeys = [...new Set(allEvents.map(event => event.pubkey))];
    
    // Fetch profiles for these pubkeys
    const profileFilter: Filter = {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: uniquePubkeys
    };
    
    const profileEvents = await pool.querySync(relays, profileFilter);
    
    // Create a map of pubkey to profile data
    const profileMap = new Map<string, { name?: string; picture?: string; npub?: string }>();
    
    for (const profileEvent of profileEvents) {
      try {
        const profileData = JSON.parse(profileEvent.content);
        profileMap.set(profileEvent.pubkey, {
          name: profileData.name || profileData.display_name,
          picture: profileData.picture,
          npub: profileEvent.pubkey
        });
      } catch (e) {
        console.error("Error parsing profile data:", e);
      }
    }
    
    // Extract all ISBNs to fetch book details
    const isbns = allEvents
      .map(event => extractISBNFromTags(event))
      .filter((isbn): isbn is string => isbn !== null);
    
    // Fetch book details
    const books = await getBooksByISBN([...new Set(isbns)]);
    
    // Create a map of ISBN to book details
    const bookMap = new Map<string, Book>();
    books.forEach(book => {
      if (book.isbn) {
        bookMap.set(book.isbn, book);
      }
    });
    
    // Convert events to social activities
    const socialFeed: SocialActivity[] = [];
    
    for (const event of allEvents) {
      const isbn = extractISBNFromTags(event);
      
      if (!isbn && event.kind !== NOSTR_KINDS.TEXT_NOTE) {
        continue; // Skip non-TEXT_NOTE events without ISBN
      }
      
      // For TEXT_NOTE (kind 1), check if it has either k=isbn or t=bookstr
      if (event.kind === NOSTR_KINDS.TEXT_NOTE) {
        const hasIsbnTag = event.tags.some(tag => tag[0] === 'k' && tag[1] === 'isbn');
        const hasBookstrTag = event.tags.some(tag => tag[0] === 't' && tag[1] === 'bookstr');
        
        if (!hasIsbnTag && !hasBookstrTag) {
          continue; // Skip TEXT_NOTE events without k=isbn or t=bookstr
        }
      }
      
      // Get book details from the map or create a basic book object
      let book: Book;
      
      if (isbn) {
        book = bookMap.get(isbn) || {
          id: `isbn:${isbn}`,
          title: "Unknown Book",
          author: "Unknown Author",
          isbn,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        };
      } else {
        // For posts without ISBN but with bookstr tag, create a generic book object
        book = {
          id: "generic",
          title: "Book Discussion",
          author: "",
          isbn: "",
          coverUrl: ""
        };
      }
      
      // Determine activity type based on event kind
      let activityType: 'review' | 'rating' | 'tbr' | 'reading' | 'finished' | 'post';
      
      switch (event.kind) {
        case NOSTR_KINDS.REVIEW:
          activityType = 'review';
          break;
        case NOSTR_KINDS.BOOK_RATING:
          activityType = 'rating';
          break;
        case NOSTR_KINDS.BOOK_TBR:
          activityType = 'tbr';
          break;
        case NOSTR_KINDS.BOOK_READING:
          activityType = 'reading';
          break;
        case NOSTR_KINDS.BOOK_READ:
          activityType = 'finished';
          break;
        case NOSTR_KINDS.TEXT_NOTE:
          activityType = 'post';
          break;
        default:
          continue; // Skip unknown event kinds
      }
      
      // Find media tags for posts
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create social activity object
      const activity: SocialActivity = {
        id: event.id,
        pubkey: event.pubkey,
        type: activityType,
        book,
        content: event.content,
        rating: extractRatingFromTags(event),
        createdAt: event.created_at * 1000,
        author: profileMap.get(event.pubkey),
        reactions: {
          count: 0,
          userReacted: false
        },
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true"
      };
      
      socialFeed.push(activity);
    }
    
    // Sort by creation date, newest first
    return socialFeed.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching social feed:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch book-related events for a specific ISBN
 */
export async function fetchBookActivity(isbn: string, limit = 20): Promise<SocialActivity[]> {
  if (!isbn) {
    console.error("Cannot fetch book activity: No ISBN provided");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    console.log(`Fetching activity for book ISBN: ${isbn}`);
    
    // Fetch all book-related events for this ISBN
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING, 
        NOSTR_KINDS.BOOK_READ,
        NOSTR_KINDS.BOOK_RATING,
        NOSTR_KINDS.REVIEW,
        NOSTR_KINDS.TEXT_NOTE
      ],
      limit
    };
    
    // Add #i tag filter for ISBN using the exact format from the request
    filter['#i'] = [`isbn:${isbn}`];
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} events for ISBN ${isbn}`);
    
    // Get all unique pubkeys to fetch profiles
    const uniquePubkeys = [...new Set(events.map(event => event.pubkey))];
    
    // Fetch profiles for these pubkeys
    const profiles = await fetchUserProfiles(uniquePubkeys);
    
    // Create a map of pubkey to profile data
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.pubkey, {
        name: profile.name || profile.display_name,
        picture: profile.picture,
        npub: profile.pubkey
      });
    });
    
    // Fetch book details
    const books = await getBooksByISBN([isbn]);
    const book = books.length > 0 ? books[0] : {
      id: `isbn:${isbn}`,
      title: "Unknown Book",
      author: "Unknown Author",
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    };
    
    // Convert events to social activities
    const activities: SocialActivity[] = [];
    
    for (const event of events) {
      // Determine activity type based on event kind
      let activityType: 'review' | 'rating' | 'tbr' | 'reading' | 'finished' | 'post';
      
      switch (event.kind) {
        case NOSTR_KINDS.REVIEW:
          activityType = 'review';
          break;
        case NOSTR_KINDS.BOOK_RATING:
          activityType = 'rating';
          break;
        case NOSTR_KINDS.BOOK_TBR:
          activityType = 'tbr';
          break;
        case NOSTR_KINDS.BOOK_READING:
          activityType = 'reading';
          break;
        case NOSTR_KINDS.BOOK_READ:
          activityType = 'finished';
          break;
        case NOSTR_KINDS.TEXT_NOTE:
          activityType = 'post';
          break;
        default:
          continue; // Skip unknown event kinds
      }
      
      // Find media tags for posts
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create social activity object
      const activity: SocialActivity = {
        id: event.id,
        pubkey: event.pubkey,
        type: activityType,
        book,
        content: event.content,
        rating: extractRatingFromTags(event),
        createdAt: event.created_at * 1000,
        author: profileMap.get(event.pubkey),
        reactions: {
          count: 0,
          userReacted: false
        },
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true"
      };
      
      activities.push(activity);
    }
    
    // Sort by creation date, newest first
    return activities.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book activity:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch global social feed (no author filter)
 */
export async function fetchGlobalSocialFeed(limit = 20): Promise<SocialActivity[]> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    console.log("Fetching global social feed");
    
    // Fetch book-related events (with k=isbn tag)
    const isbnFilter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING, 
        NOSTR_KINDS.BOOK_READ,
        NOSTR_KINDS.BOOK_RATING,
        NOSTR_KINDS.REVIEW,
        NOSTR_KINDS.TEXT_NOTE
      ],
      "#k": ["isbn"],
      limit
    };
    
    // Fetch posts with t=bookstr tag
    const bookstrFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      "#t": ["bookstr"],
      limit
    };
    
    // Execute queries in parallel
    const [isbnEvents, bookstrEvents] = await Promise.all([
      pool.querySync(relays, isbnFilter),
      pool.querySync(relays, bookstrFilter)
    ]);
    
    console.log(`Found ${isbnEvents.length} events with k=isbn and ${bookstrEvents.length} events with t=bookstr`);
    
    // Combine events, removing duplicates
    const eventMap = new Map();
    
    // Add all events to the map, using the event ID as the key
    [...isbnEvents, ...bookstrEvents].forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Convert back to array
    const allEvents = Array.from(eventMap.values());
    
    // Get all unique pubkeys to fetch profiles
    const uniquePubkeys = [...new Set(allEvents.map(event => event.pubkey))];
    
    // Fetch profiles for these pubkeys
    const profiles = await fetchUserProfiles(uniquePubkeys);
    
    // Create a map of pubkey to profile data
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.pubkey, {
        name: profile.name || profile.display_name,
        picture: profile.picture,
        npub: profile.pubkey
      });
    });
    
    // Extract all ISBNs to fetch book details
    const isbns = allEvents
      .map(event => extractISBNFromTags(event))
      .filter((isbn): isbn is string => isbn !== null);
    
    // Fetch book details
    const books = await getBooksByISBN([...new Set(isbns)]);
    
    // Create a map of ISBN to book details
    const bookMap = new Map<string, Book>();
    books.forEach(book => {
      if (book.isbn) {
        bookMap.set(book.isbn, book);
      }
    });
    
    // Convert events to social activities
    const socialFeed: SocialActivity[] = [];
    
    for (const event of allEvents) {
      const isbn = extractISBNFromTags(event);
      
      // Get book details from the map or create a basic book object
      let book: Book;
      
      if (isbn) {
        book = bookMap.get(isbn) || {
          id: `isbn:${isbn}`,
          title: "Unknown Book",
          author: "Unknown Author",
          isbn,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        };
      } else {
        // For posts without ISBN but with bookstr tag, create a generic book object
        book = {
          id: "generic",
          title: "Book Discussion",
          author: "",
          isbn: "",
          coverUrl: ""
        };
      }
      
      // Determine activity type based on event kind
      let activityType: 'review' | 'rating' | 'tbr' | 'reading' | 'finished' | 'post';
      
      switch (event.kind) {
        case NOSTR_KINDS.REVIEW:
          activityType = 'review';
          break;
        case NOSTR_KINDS.BOOK_RATING:
          activityType = 'rating';
          break;
        case NOSTR_KINDS.BOOK_TBR:
          activityType = 'tbr';
          break;
        case NOSTR_KINDS.BOOK_READING:
          activityType = 'reading';
          break;
        case NOSTR_KINDS.BOOK_READ:
          activityType = 'finished';
          break;
        case NOSTR_KINDS.TEXT_NOTE:
          activityType = 'post';
          break;
        default:
          continue; // Skip unknown event kinds
      }
      
      // Find media tags for posts
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create social activity object
      const activity: SocialActivity = {
        id: event.id,
        pubkey: event.pubkey,
        type: activityType,
        book,
        content: event.content,
        rating: extractRatingFromTags(event),
        createdAt: event.created_at * 1000,
        author: profileMap.get(event.pubkey),
        reactions: {
          count: 0,
          userReacted: false
        },
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true"
      };
      
      socialFeed.push(activity);
    }
    
    // Sort by creation date, newest first
    return socialFeed.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching global social feed:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch posts that have book tags (kind 1 with 'i' tag)
 */
export async function fetchBookPosts(pubkey?: string, useMockData: boolean = false): Promise<Post[]> {
  const limit = 20; // Hard-coded limit to 20
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    console.log("Fetching book posts from relays:", relays);
    console.log("For pubkey:", pubkey || "all users");
    
    // Base filter for all posts
    const baseFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      limit: limit
    };
    
    // If pubkey is provided, only fetch posts from that user
    if (pubkey) {
      baseFilter.authors = [pubkey];
    }
    
    // Create separate filters for k=isbn and t=bookstr
    const isbnFilter = { ...baseFilter, "#k": ["isbn"] };
    const bookstrFilter = { ...baseFilter, "#t": ["bookstr"] };
    
    // Execute queries in parallel
    const [isbnEvents, bookstrEvents] = await Promise.all([
      pool.querySync(relays, isbnFilter),
      pool.querySync(relays, bookstrFilter)
    ]);
    
    console.log(`Found ${isbnEvents.length} posts with k=isbn and ${bookstrEvents.length} posts with t=bookstr`);
    
    // Combine events, removing duplicates
    const eventMap = new Map();
    
    // Add all events to the map, using the event ID as the key
    [...isbnEvents, ...bookstrEvents].forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Convert back to array
    const allEvents = Array.from(eventMap.values());
    console.log(`Combined into ${allEvents.length} unique events`);
    
    // Process events to extract posts
    const posts: Post[] = [];
    const userPubkeys = new Set<string>();
    
    for (const event of allEvents) {
      userPubkeys.add(event.pubkey);
      
      // Extract ISBN from the tag (could be in format "isbn:1234567890" or just the ISBN)
      const bookTag = event.tags.find(tag => tag[0] === 'i');
      let isbn = "";
      
      if (bookTag) {
        const isbnValue = bookTag[1];
        isbn = isbnValue.startsWith('isbn:') 
          ? isbnValue.substring(5) 
          : isbnValue;
      }
      
      // Find optional media tags
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create post object
      const post: Post = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000,
        taggedBook: isbn ? {
          isbn: isbn,
          title: "Book", // Will be updated when we fetch book details
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        } : undefined,
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true",
        reactions: {
          count: 0,
          userReacted: false
        }
      };
      
      posts.push(post);
    }
    
    // Fetch user profiles for post authors
    if (userPubkeys.size > 0) {
      console.log("Fetching profiles for authors:", Array.from(userPubkeys));
      const profiles = await fetchUserProfiles(Array.from(userPubkeys));
      
      // Add author information to posts
      for (const post of posts) {
        const authorProfile = profiles.find(p => p.pubkey === post.pubkey);
        if (authorProfile) {
          post.author = {
            name: authorProfile.name || authorProfile.display_name,
            picture: authorProfile.picture,
            npub: authorProfile.npub
          };
        }
      }
    }
    
    // Get all unique ISBNs to fetch book details
    const isbns = posts
      .map(post => post.taggedBook?.isbn)
      .filter((isbn): isbn is string => Boolean(isbn));
    
    if (isbns.length > 0) {
      try {
        console.log("Fetching book details for ISBNs:", isbns);
        // Fetch book details
        const books = await getBooksByISBN([...new Set(isbns)]);
        
        // Update post objects with book details
        for (const post of posts) {
          if (post.taggedBook?.isbn) {
            const book = books.find(b => b.isbn === post.taggedBook?.isbn);
            if (book) {
              post.taggedBook = {
                isbn: book.isbn,
                title: book.title,
                coverUrl: book.coverUrl || post.taggedBook.coverUrl
              };
            }
          }
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    }
    
    console.log("Final processed posts:", posts.length);
    pool.close(relays);
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book posts:", error);
    return [];
  }
}
