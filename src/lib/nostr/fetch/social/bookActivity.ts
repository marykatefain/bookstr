
import { type Filter } from "nostr-tools";
import { SocialActivity, NOSTR_KINDS, Book } from "../../types";
import { getUserRelays } from "../../relay";
import { extractRatingFromTags } from "../../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { fetchUserProfiles } from "../../profile";
import { getSharedPool } from "../../utils/poolManager";

/**
 * Fetch book-related events for a specific ISBN
 */
export async function fetchBookActivity(isbn: string, limit = 20): Promise<SocialActivity[]> {
  if (!isbn) {
    console.error("Cannot fetch book activity: No ISBN provided");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
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
  }
}
