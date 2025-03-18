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
        NOSTR_KINDS.REVIEW
      ],
      authors: follows,
      limit
    };
    
    const events = await pool.querySync(relays, filter);
    
    // Get all unique pubkeys to fetch profiles
    const uniquePubkeys = [...new Set(events.map(event => event.pubkey))];
    
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
    const isbns = events
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
    
    for (const event of events) {
      const isbn = extractISBNFromTags(event);
      
      if (!isbn) {
        continue; // Skip events without ISBN
      }
      
      // Get book details from the map or create a basic book object
      let book = bookMap.get(isbn);
      
      if (!book) {
        // Basic book object if we couldn't fetch details
        book = {
          id: `isbn:${isbn}`,
          title: "Unknown Book",
          author: "Unknown Author",
          isbn,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        };
      }
      
      // Determine activity type based on event kind
      let activityType: 'review' | 'rating' | 'tbr' | 'reading' | 'finished';
      
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
        default:
          continue; // Skip unknown event kinds
      }
      
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
        }
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
    
    // Add tag filter for ISBN
    filter['i'] = [`isbn:${isbn}`];
    
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
 * Fetch posts that have book tags (kind 1 with 'i' tag)
 */
export async function fetchBookPosts(pubkey?: string, useMockData: boolean = false): Promise<Post[]> {
  const limit = 20; // Hard-coded limit to 20
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    console.log("Fetching book posts from relays:", relays);
    console.log("For pubkey:", pubkey || "all users");
    
    // Configure filter for posts with book tags
    const filter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      limit: limit
    };
    
    // If pubkey is provided, only fetch posts from that user
    if (pubkey) {
      filter.authors = [pubkey];
      
      // Use an empty string for the i tag to ensure we're fetching book posts
      // but not filtering by a specific ISBN
      filter['i'] = ['']; // Removed the # sign here
    }
    
    console.log("Using filter:", filter);
    const events = await pool.querySync(relays, filter);
    console.log("Fetched events:", events.length);
    
    // Process events to extract posts with book tags
    const posts: Post[] = [];
    const userPubkeys = new Set<string>();
    
    for (const event of events) {
      // Only include posts that have book tags (i tags)
      const bookTag = event.tags.find(tag => tag[0] === 'i');
      if (!bookTag) {
        console.log("Skipping event without book tag:", event.id);
        continue;
      }
      
      console.log("Found post with book tag:", event.id, bookTag);
      userPubkeys.add(event.pubkey);
      
      // Extract ISBN from the tag (could be in format "isbn:1234567890" or just the ISBN)
      const isbnValue = bookTag[1];
      const isbn = isbnValue.startsWith('isbn:') 
        ? isbnValue.substring(5) 
        : isbnValue;
      
      // Find optional media tags
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create post object
      const post: Post = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000,
        taggedBook: {
          isbn: isbn,
          title: "Book", // Will be updated when we fetch book details
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        },
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
