
import { Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../../types";
import { extractFirstEventTag } from "../../utils/eventUtils";

/**
 * Extract ISBN from event tags
 */
export function extractISBNFromTags(event: Event): string | null {
  const isbn = extractFirstEventTag(event, 'k', 'isbn');
  return isbn;
}

/**
 * Extract multiple ISBNs from event tags
 */
export function extractISBNsFromTags(event: Event): string[] {
  const isbns: string[] = [];
  if (!event.tags) return isbns;
  
  for (const tag of event.tags) {
    if (tag[0] === 'k' && tag[1] === 'isbn' && tag[2]) {
      isbns.push(tag[2]);
    }
  }
  
  return isbns;
}

/**
 * Extract rating value from event tags
 */
export function extractRatingFromTags(event: Event): number | undefined {
  if (!event.tags) return undefined;
  
  for (const tag of event.tags) {
    if (tag[0] === 'rating' && tag[1]) {
      const rating = parseInt(tag[1], 10);
      return isNaN(rating) ? undefined : rating;
    }
  }
  
  return undefined;
}

/**
 * Convert an event into a Book object
 */
export function eventToBook(event: Event, isbn?: string): Book | null {
  if (!event) return null;

  // Try to get ISBN from event if not provided as parameter
  const bookIsbn = isbn || extractISBNFromTags(event);
  if (!bookIsbn) return null;

  // Get author name from the event tags (if present)
  let author = null;
  for (const tag of event.tags) {
    if (tag[0] === 'author' && tag[1]) {
      author = tag[1];
      break;
    }
  }

  // Get book title from the event tags (if present)
  let title = null;
  for (const tag of event.tags) {
    if (tag[0] === 'title' && tag[1]) {
      title = tag[1];
      break;
    }
  }

  // Determine the reading status based on the event kind
  let status: 'tbr' | 'reading' | 'finished' | undefined;
  const eventKind = event.kind;

  if (eventKind === NOSTR_KINDS.BOOK_TBR) {
    status = 'tbr';
  } else if (eventKind === NOSTR_KINDS.BOOK_READING) {
    status = 'reading';
  } else if (eventKind === NOSTR_KINDS.BOOK_READ) {
    status = 'finished';
  }

  // Extract rating if present in tags
  const rating = extractRatingFromTags(event);

  // Create the basic book object
  const book: Book = {
    id: `isbn:${bookIsbn}`,
    isbn: bookIsbn,
    title: title || undefined,
    author: author || undefined,
    readingStatus: status ? {
      status,
      dateAdded: event.created_at * 1000, // Convert UNIX timestamp to milliseconds
      rating: rating
    } : undefined
  };

  return book;
}

// Re-export all functions for use elsewhere
export { 
  extractRatingFromTags 
};
