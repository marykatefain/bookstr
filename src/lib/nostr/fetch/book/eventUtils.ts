
import { type Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../../types";
import { getReadingStatusFromEventKind, extractRatingFromTags as extractRatingFromTagsUtil } from "../../utils/eventUtils";

/**
 * Extract all ISBNs from the tags of an event
 */
export function extractISBNsFromTags(event: Event): string[] {
  const isbnTags = event.tags.filter(([name, value]) => {
    if (event.kind === NOSTR_KINDS.REVIEW) {
      return name === 'd' && value?.startsWith('isbn:');
    } else {
      return name === 'i' && value?.startsWith('isbn:');
    }
  });

  return isbnTags.map(([, isbn]) => isbn.replace(/^isbn:/, ''));
}

/**
 * Extract a single ISBN from tags (used for backward compatibility)
 */
export function extractISBNFromTags(event: Event): string | null {
  return extractISBNsFromTags(event)[0] || null;
}

/**
 * Extract rating from tags
 * Re-exported from utils/eventUtils for convenience
 */
export function extractRatingFromTags(event: Event): number | undefined {
  return extractRatingFromTagsUtil(event);
}

/**
 * Convert a Nostr event to a Book object
 */
export function eventToBook(event: Event, isbn: string): Book | null {
  try {
    if (!isbn) {
      console.warn('Missing ISBN for event:', event);
      return null;
    }
    
    // Default book with required fields
    const book: Book = {
      id: `${event.id}-${isbn}`, // Make ID unique for each book-isbn combination
      title: "", // Will be filled in later
      author: "", // Will be filled in later
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Extract rating if this is a review/rating event
    let rating;
    if (event.kind === NOSTR_KINDS.REVIEW) {
      rating = extractRatingFromTags(event);
      console.log(`Extracted rating ${rating} from event`, event);
    }
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEventKind(event.kind),
      dateAdded: event.created_at * 1000,
      rating: rating !== undefined ? rating : undefined
    };
    
    return { ...book, readingStatus };
  } catch (error) {
    console.error('Error parsing book from event:', error);
    return null;
  }
}

/**
 * Simple placeholder for backward compatibility
 */
export async function ensureBookMetadata(book: Book): Promise<string | null> {
  console.log("Book metadata is no longer needed in the simplified approach");
  return "placeholder"; // Return a non-null value to avoid errors
}
