import { type Filter } from "nostr-tools";
import { SocialActivity, NOSTR_KINDS, Book } from "../../types";
import { getUserRelays } from "../../relay";
import { getCurrentUser } from "../../user";
import { fetchFollowingList } from "../profileFetch";
import { extractISBNFromTags, extractRatingFromTags } from "../../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { fetchUserProfiles } from "../../profile";
import { getSharedPool } from "../../utils/poolManager";

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
  const pool = getSharedPool();
  
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
    
    // Filter out reply posts (those with 'e' tags)
    const nonReplyEvents = allEvents.filter(event => 
      !event.tags.some(tag => tag[0] === 'e')
    );
    
    console.log(`Filtered out ${allEvents.length - nonReplyEvents.length} reply posts`);
    
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
    
    for (const event of nonReplyEvents) {
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
  }
}
