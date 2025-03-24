
/**
 * Converts a raw rating (0-1 scale) to a display rating (1-5 scale)
 * Always converts from the 0-1 scale to 1-5 scale, regardless of input value
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
 */
export function convertDisplayRatingToRawRating(displayRating: number): number {
  return displayRating / 5;
}
