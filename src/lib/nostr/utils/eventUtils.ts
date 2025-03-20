
import { Event } from "nostr-tools";
import { NOSTR_KINDS } from "../types";

/**
 * Extract ISBN from a tag
 */
export function extractISBNFromTags(event: Event): string | null {
  // First try to get ISBN from "d" tag (preferred format for reviews)
  const dTags = event.tags.filter(tag => tag[0] === 'd');
  for (const tag of dTags) {
    if (tag[1] && tag[1].startsWith('isbn:')) {
      return tag[1].replace('isbn:', '');
    }
  }
  
  // Then try to get ISBN from "i" tag
  const iTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  if (iTag && iTag[1]) {
    return iTag[1].replace('isbn:', '');
  }
  
  // Final fallback: Look for any tag containing ISBN pattern
  for (const tag of event.tags) {
    if (tag[1] && typeof tag[1] === 'string' && tag[1].includes('isbn')) {
      const match = tag[1].match(/isbn:?(\d+)/i);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}

/**
 * Extract all ISBNs from an event's tags
 * For events that reference multiple books
 */
export function extractAllISBNsFromTags(event: Event): string[] {
  const isbns: string[] = [];
  
  // Look for all i tags that contain isbn
  const iTags = event.tags.filter(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  for (const tag of iTags) {
    if (tag[1]) {
      isbns.push(tag[1].replace('isbn:', ''));
    }
  }
  
  // Also check d tags
  const dTags = event.tags.filter(tag => tag[0] === 'd' && tag[1]?.startsWith('isbn:'));
  for (const tag of dTags) {
    if (tag[1]) {
      isbns.push(tag[1].replace('isbn:', ''));
    }
  }
  
  // Deduplicate and return
  return [...new Set(isbns)];
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

/**
 * Get all unique pubkeys from a list of events
 */
export function extractUniquePubkeys(events: Event[]): string[] {
  return [...new Set(events.map(event => event.pubkey))];
}
