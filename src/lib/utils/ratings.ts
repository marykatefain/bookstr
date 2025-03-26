
/**
 * Ratings Utility Functions
 * 
 * IMPORTANT: Bookstr uses two different rating scales:
 * 1. Raw Rating (0-1 scale): Used internally for storage in Nostr events
 * 2. Display Rating (1-5 scale): Used for UI display as stars
 * 
 * Always use these utility functions when converting between the two scales
 * to ensure consistency throughout the application.
 */

/**
 * Converts a raw rating (0-1 scale) to a display rating (1-5 scale)
 * Always converts from the 0-1 scale to 1-5 scale, regardless of input value
 * 
 * @param rawRating - Rating on 0-1 scale (or undefined/null)
 * @returns Rating on 1-5 scale as an integer, or undefined if input is undefined/null
 */
export function convertRawRatingToDisplayRating(rawRating: number | null | undefined): number | undefined {
  if (rawRating === null || rawRating === undefined) {
    return undefined;
  }
  
  // Always convert from 0-1 scale to 1-5 scale
  const scaledRating = Math.round(rawRating * 5);
  // Ensure minimum 1 star and maximum 5 stars
  return Math.min(5, Math.max(1, scaledRating));
}

/**
 * Converts a display rating (1-5 scale) to a raw rating (0-1 scale)
 * 
 * @param displayRating - Rating on 1-5 scale
 * @returns Rating on 0-1 scale (for storage in Nostr events)
 */
export function convertDisplayRatingToRawRating(displayRating: number): number {
  return displayRating / 5;
}
