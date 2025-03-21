
import { Event } from "nostr-tools";
import { NOSTR_KINDS } from "../types";
import { processRatingValue } from "@/lib/utils/ratingUtils";

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
  console.log(`Extracting rating from event ${event.id}, kind ${event.kind}`, event.tags);
  
  // First, directly look for the rating tag
  const ratingTag = event.tags.find(tag => tag[0] === 'rating');
  if (ratingTag && ratingTag[1]) {
    try {
      console.log(`Found rating tag: ${ratingTag[1]}`);
      // Process the rating using our utility function
      const rating = processRatingValue(ratingTag[1]);
      if (rating !== null) {
        return parseNormalizeRating(rating);
      }
    } catch (e) {
      console.error("Error parsing rating:", e);
    }
  }

  // Check for alternative rating formats
  // Look for any tag that might contain a rating
  for (const tag of event.tags) {
    if (tag[0] === 'r' || tag[0] === 'score' || (tag[0] === 'alt' && tag[1] && tag[1].includes('rating'))) {
      try {
        if (tag[1] && typeof tag[1] === 'string') {
          // Process the rating using our utility function
          const rating = processRatingValue(tag[1]);
          if (rating !== null) {
            return parseNormalizeRating(rating);
          }
        }
      } catch (e) {
        console.error("Error parsing alternative rating tag:", e);
      }
    }
  }

  // If kind is BOOK_RATING, look for content field which might contain a rating
  if (event.kind === NOSTR_KINDS.BOOK_RATING && event.content) {
    try {
      const contentValue = parseFloat(event.content);
      if (!isNaN(contentValue)) {
        return parseNormalizeRating(contentValue);
      }
    } catch (e) {
      console.error("Error parsing content rating:", e);
    }
  }

  // No valid rating found
  console.log(`No valid rating found for event ${event.id}`);
  return undefined;
}

/**
 * Helper function to normalize ratings to 0-1 scale
 */
function parseNormalizeRating(value: number): number {
  // If rating is already in 0-1 scale
  if (value >= 0 && value <= 1) {
    console.log(`Rating already in 0-1 scale: ${value}`);
    return value;
  } 
  // If rating is in 1-5 scale
  else if (value >= 1 && value <= 5) {
    const normalizedValue = value / 5;
    console.log(`Normalizing rating from 1-5 scale (${value}) to 0-1 scale: ${normalizedValue}`);
    return normalizedValue;
  }
  // Handle any other scales by clamping to 0-1
  else {
    const clampedValue = Math.min(5, Math.max(1, value));
    const normalizedValue = clampedValue / 5;
    console.log(`Clamping unexpected rating value ${value} to ${clampedValue}, normalized: ${normalizedValue}`);
    return normalizedValue;
  }
}

/**
 * Determine reading status from event kind
 */
export function getReadingStatusFromEventKind(eventKind: number): 'tbr' | 'reading' | 'finished' {
  if (eventKind === NOSTR_KINDS.BOOK_TBR) return 'tbr';
  if (eventKind === NOSTR_KINDS.BOOK_READING) return 'reading';
  if (eventKind === NOSTR_KINDS.BOOK_READ) return 'finished';
  if (eventKind === NOSTR_KINDS.REVIEW || eventKind === NOSTR_KINDS.BOOK_RATING) return 'finished';
  
  // Default to tbr if not recognized
  return 'tbr';
}

/**
 * Get all unique pubkeys from a list of events
 */
export function extractUniquePubkeys(events: Event[]): string[] {
  return [...new Set(events.map(event => event.pubkey))];
}
