
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
 */
export function extractRatingFromTags(event: Event): number | undefined {
  // First check for standard 'rating' tag (0-1 scale)
  const ratingTag = event.tags.find(tag => tag[0] === 'rating');
  if (ratingTag && ratingTag[1]) {
    const rating = parseFloat(ratingTag[1]);
    if (!isNaN(rating)) {
      if (rating >= 0 && rating <= 1) {
        // Rating is already in 0-1 scale
        console.log(`Extracted valid 0-1 scale rating: ${rating} from event ${event.id}`);
        return rating;
      } else if (rating >= 1 && rating <= 5) {
        // Convert from 1-5 scale to 0-1 scale
        const normalizedRating = rating / 5;
        console.log(`Normalized 1-5 scale rating ${rating} to ${normalizedRating} from event ${event.id}`);
        return normalizedRating;
      } else {
        console.log(`Found out-of-range rating value: ${ratingTag[1]} in event ${event.id}`);
      }
    } else {
      console.log(`Found non-numeric rating value: ${ratingTag[1]} in event ${event.id}`);
    }
  }
  
  // Then check for 'star' tag or other rating formats (typically 1-5 scale)
  for (const tag of event.tags) {
    if (tag[0] && ['star', 'stars', 'rating:1-5'].includes(tag[0].toLowerCase()) && tag[1]) {
      const starRating = parseFloat(tag[1]);
      if (!isNaN(starRating)) {
        if (starRating >= 1 && starRating <= 5) {
          // Convert from 1-5 scale to 0-1 scale
          const normalizedRating = starRating / 5;
          console.log(`Extracted star rating: ${starRating}/5 (normalized: ${normalizedRating}) from event ${event.id}`);
          return normalizedRating;
        } else {
          console.log(`Found out-of-range star rating: ${starRating} in event ${event.id}`);
        }
      } else {
        console.log(`Found non-numeric star rating: ${tag[1]} in event ${event.id}`);
      }
    }
  }
  
  // Finally check content for rating patterns like "5/5" or "⭐⭐⭐⭐⭐"
  if (event.content) {
    // Check for X/5 pattern
    const ratingPattern = /(\d)[\/\s]*5/;
    const match = event.content.match(ratingPattern);
    if (match && match[1]) {
      const starRating = parseInt(match[1], 10);
      if (starRating >= 1 && starRating <= 5) {
        const normalizedRating = starRating / 5;
        console.log(`Extracted rating ${starRating}/5 (normalized: ${normalizedRating}) from content text in event ${event.id}`);
        return normalizedRating;
      }
    }
    
    // Count star emojis
    const starCount = (event.content.match(/⭐/g) || []).length;
    if (starCount >= 1 && starCount <= 5) {
      const normalizedRating = starCount / 5;
      console.log(`Extracted ${starCount} star emojis (normalized: ${normalizedRating}) from content in event ${event.id}`);
      return normalizedRating;
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
