
import { Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../../types";
import { Rating } from "@/lib/utils/Rating";

/**
 * Extract ISBN from event tags
 */
export function extractISBNFromTags(event: Event): string | null {
  if (event.kind === 31985) {
    return event.tags.find(([name, value]) => name === 'd' && value.startsWith('isbn:'))?.[1].replace(/^isbn:/, '') || null;
  } else {
    const [isbn] = extractISBNsFromTags(event);
    return isbn || null;
  }
}

/**
 * Extract multiple ISBNs from event tags
 */
export function extractISBNsFromTags(event: Event): string[] {
  const isbns: string[] = [];
  if (!event.tags) return isbns;
  
  for (const [name, value] of event.tags) {
    if (name === 'i' && value.startsWith('isbn:')) {
      isbns.push(value.replace(/^isbn:/, ''));
    }
  }

  console.log({isbns})
  
  return isbns;
}

/**
 * Extract rating value from event tags
 */
export function extractRatingFromTags(event: Event): Rating | undefined {
  if (!event.tags) return undefined;
  
  for (const tag of event.tags) {
    if (tag[0] === 'rating' && tag[1]) {
      const ratingValue = parseFloat(tag[1]);
      if (!isNaN(ratingValue)) {
        try {
          return new Rating(ratingValue);
        } catch (e) {
          console.error('Invalid rating value in event tag:', ratingValue, e);
        }
      }
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
    title: title || "Unknown Title",
    author: author || "Unknown Author",
    coverUrl: "", // Add default empty coverUrl to satisfy type requirement
    readingStatus: status ? {
      status,
      dateAdded: event.created_at * 1000, // Convert UNIX timestamp to milliseconds
      rating: rating
    } : undefined
  };

  return book;
}
