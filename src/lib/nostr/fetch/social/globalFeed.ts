
import { SimplePool, type Filter } from "nostr-tools";
import { SocialActivity, NOSTR_KINDS, Book } from "../../types";
import { getUserRelays } from "../../relay";
import { extractISBNFromTags, extractRatingFromTags } from "../../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { fetchUserProfiles } from "../../profile";

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
