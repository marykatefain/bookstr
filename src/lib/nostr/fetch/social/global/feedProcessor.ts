
import { type Event } from "nostr-tools";
import { SocialActivity, NOSTR_KINDS, Book } from "../../../types";
import { extractISBNFromTags, extractRatingFromTags, extractUniquePubkeys } from "../../../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { fetchUserProfiles } from "../../../profile";

/**
 * Process feed events into SocialActivity objects - simplified for book list events only
 */
export async function processFeedEvents(events: Event[], limit: number): Promise<SocialActivity[]> {
  console.log(`Processing ${events.length} book list events into social activities`);
  
  if (!events || events.length === 0) {
    console.log("No events to process for global feed");
    return [];
  }
  
  // Filter to make sure we only have book list events 
  const filteredEvents = events.filter(event => {
    return [NOSTR_KINDS.BOOK_TBR, NOSTR_KINDS.BOOK_READING, NOSTR_KINDS.BOOK_READ].includes(event.kind);
  });
  
  console.log(`Filtered down to ${filteredEvents.length} valid book list events`);
  
  // Limit the number of events to process
  const eventsToProcess = filteredEvents.slice(0, limit);
  
  // If no events found, return empty array
  if (eventsToProcess.length === 0) {
    console.log("No valid book list events found for global feed");
    return [];
  }
  
  // Get all unique pubkeys to fetch profiles in one batch
  const uniquePubkeys = extractUniquePubkeys(eventsToProcess);
  console.log(`Fetching profiles for ${uniquePubkeys.length} unique pubkeys`);
  
  // Fetch profiles for these pubkeys with error handling
  let profiles = [];
  try {
    profiles = await fetchUserProfiles(uniquePubkeys);
    console.log(`Received ${profiles.length} user profiles`);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    // Continue with empty profiles rather than failing completely
  }
  
  // Create a map of pubkey to profile data for faster lookups
  const profileMap = new Map();
  profiles.forEach(profile => {
    if (profile && profile.pubkey) {
      profileMap.set(profile.pubkey, {
        name: profile.name || profile.display_name,
        picture: profile.picture,
        npub: profile.pubkey
      });
    }
  });
  
  // Extract all ISBNs to fetch book details in one batch
  const isbns = eventsToProcess
    .map(event => extractISBNFromTags(event))
    .filter((isbn): isbn is string => isbn !== null);
  
  console.log(`Fetching details for ${isbns.length} unique books`);
  
  // Fetch book details with error handling
  let books = [];
  try {
    if (isbns.length > 0) {
      books = await getBooksByISBN([...new Set(isbns)]);
      console.log(`Received ${books.length} book details`);
    }
  } catch (error) {
    console.error("Error fetching book details:", error);
    // Continue with empty books rather than failing completely
  }
  
  // Create a map of ISBN to book details for faster lookups
  const bookMap = new Map<string, Book>();
  books.forEach(book => {
    if (book && book.isbn) {
      bookMap.set(book.isbn, book);
    }
  });
  
  const activities = createSocialActivities(eventsToProcess, bookMap, profileMap);
  console.log(`Created ${activities.length} social activities`);
  return activities;
}

/**
 * Convert filtered events to SocialActivity objects
 */
function createSocialActivities(
  events: Event[], 
  bookMap: Map<string, Book>, 
  profileMap: Map<string, any>
): SocialActivity[] {
  const socialFeed: SocialActivity[] = [];
  
  for (const event of events) {
    try {
      const isbn = extractISBNFromTags(event);
      
      // Get book details from the map or create a basic book object
      let book: Book;
      
      if (isbn) {
        book = bookMap.get(isbn) || {
          id: `isbn:${isbn}`, // Ensure we have an id
          title: "Unknown Book",
          author: "Unknown Author",
          isbn,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        };
      } else {
        // Fallback book object
        book = {
          id: `event:${event.id}`, // Ensure we have an id
          title: "Unknown Book",
          author: "",
          isbn: "",
          coverUrl: ""
        };
      }
      
      // Determine activity type based on event kind
      let activityType: 'tbr' | 'reading' | 'finished';
      
      switch (event.kind) {
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
        // We don't include media fields as book list events typically don't have them
      };
      
      socialFeed.push(activity);
    } catch (error) {
      console.error("Error processing event:", error);
      // Skip this event but continue processing others
    }
  }
  
  // Sort by creation date, newest first
  return socialFeed.sort((a, b) => b.createdAt - a.createdAt);
}
