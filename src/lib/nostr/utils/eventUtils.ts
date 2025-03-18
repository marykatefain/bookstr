
import { Event } from "nostr-tools";
import { NOSTR_KINDS } from "../types";

/**
 * Extract ISBN from a tag
 */
export function extractISBNFromTags(event: Event): string | null {
  // Check for direct ISBN tag (i tag)
  const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  if (isbnTag && isbnTag[1]) {
    return isbnTag[1].replace('isbn:', '');
  }
  
  return null;
}

/**
 * Extract rating from tags
 */
export function extractRatingFromTags(event: Event): number | undefined {
  const ratingTag = event.tags.find(tag => tag[0] === 'rating');
  if (ratingTag && ratingTag[1]) {
    const rating = parseInt(ratingTag[1], 10);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
  }
  return undefined;
}

/**
 * Determine reading status from event kind
 */
export function getReadingStatusFromEventKind(eventKind: number): 'tbr' | 'reading' | 'finished' {
  if (eventKind === NOSTR_KINDS.BOOK_TBR) return 'tbr';
  if (eventKind === NOSTR_KINDS.BOOK_READING) return 'reading';
  if (eventKind === NOSTR_KINDS.BOOK_READ) return 'finished';
  
  // Default to tbr if not recognized
  return 'tbr';
}
