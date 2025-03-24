
/**
 * Converts a raw rating (0-1 scale) to a display rating (1-5 scale)
 * Ensures the rating is at least 1 star and at most 5 stars
 */
export function convertRawRatingToDisplayRating(rawRating: number | null | undefined): number | undefined {
  if (rawRating === null || rawRating === undefined) {
    return undefined;
  }
  
  // Scale from 0-1 to 1-5, ensuring minimum 1 star
  return Math.min(5, Math.max(1, Math.round(rawRating * 5)));
}

/**
 * Converts a display rating (1-5 scale) to a raw rating (0-1 scale)
 */
export function convertDisplayRatingToRawRating(displayRating: number): number {
  return displayRating / 5;
}
