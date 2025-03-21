
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
 * Extract rating from tags
 * Supports both 0-1 scale (standard Nostr) and 1-5 scale
 */
export function extractRatingFromTags(event: Event): number | undefined {
  console.log(`Extracting rating from event ${event.id}`, event.tags);
  
  // First, directly look for the rating tag
  const ratingTag = event.tags.find(tag => tag[0] === 'rating');
  if (ratingTag && ratingTag[1]) {
    try {
      console.log(`Found rating tag: ${ratingTag[1]}`);
      const ratingValue = parseFloat(ratingTag[1]);
      if (!isNaN(ratingValue)) {
        // Determine if it's already on 0-1 scale or 1-5 scale
        if (ratingValue >= 0 && ratingValue <= 1) {
          console.log(`Found rating in 0-1 scale: ${ratingValue}`);
          return ratingValue; // Already in 0-1 scale
        } else if (ratingValue >= 1 && ratingValue <= 5) {
          // Convert from 1-5 scale to 0-1 scale
          const normalizedRating = ratingValue / 5;
          console.log(`Converting rating from 1-5 scale (${ratingValue}) to 0-1 scale: ${normalizedRating}`);
          return normalizedRating;
        }
      }
    } catch (e) {
      console.error("Error parsing rating:", e);
    }
  }

  // Look for any tag that might contain a number rating
  for (const tag of event.tags) {
    if (tag[0] === 'r' || tag[0] === 'score' || (tag[0] === 'alt' && tag[1] && tag[1].includes('rating'))) {
      try {
        const value = parseFloat(tag[1]);
        if (!isNaN(value)) {
          // Normalize to 0-1 scale if needed
          if (value >= 0 && value <= 1) {
            console.log(`Found alternative rating in 0-1 scale: ${value}`);
            return value;
          } else if (value >= 1 && value <= 5) {
            const normalizedRating = value / 5;
            console.log(`Found alternative rating and converting from 1-5 scale (${value}) to 0-1 scale: ${normalizedRating}`);
            return normalizedRating;
          }
        }
      } catch (e) {
        console.error("Error parsing alternative rating tag:", e);
      }
    }
  }

  // No valid rating found
  console.log(`No valid rating found for event ${event.id}`);
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
