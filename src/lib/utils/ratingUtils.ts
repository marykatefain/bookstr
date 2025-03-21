
/**
 * Utility functions for handling book ratings
 */

/**
 * Process and normalize a rating value from various possible formats
 * @param ratingValue - The rating value which could be a number, string, object or undefined
 * @returns Processed rating as a number, or null if invalid
 */
export function processRatingValue(ratingValue: unknown): number | null {
  console.log('Processing rating value:', ratingValue);
  
  // Handle undefined or null
  if (ratingValue === undefined || ratingValue === null) {
    return null;
  }
  
  // Handle number directly
  if (typeof ratingValue === 'number') {
    console.log(`Numeric rating found: ${ratingValue}`);
    return ratingValue;
  }
  
  // Handle string
  if (typeof ratingValue === 'string') {
    const parsedValue = parseFloat(ratingValue);
    if (!isNaN(parsedValue)) {
      console.log(`String rating parsed: ${parsedValue}`);
      return parsedValue;
    }
    return null;
  }
  
  // Handle object with 'value' property (safely)
  if (typeof ratingValue === 'object' && ratingValue !== null) {
    const ratingObject = ratingValue as Record<string, unknown>;
    
    if ('value' in ratingObject && ratingObject.value !== undefined) {
      // Handle value as number
      if (typeof ratingObject.value === 'number') {
        console.log(`Object rating extracted (number): ${ratingObject.value}`);
        return ratingObject.value;
      }
      
      // Handle value as string
      if (typeof ratingObject.value === 'string') {
        const parsedValue = parseFloat(ratingObject.value);
        if (!isNaN(parsedValue)) {
          console.log(`Object rating extracted (string): ${parsedValue}`);
          return parsedValue;
        }
      }
    }
  }
  
  // If we reached here, we couldn't process the rating
  console.log('Could not process rating value');
  return null;
}

/**
 * Normalize a rating to a 1-5 scale for display
 * @param rating - Rating value (could be 0-1 or 1-5 scale)
 * @returns Rating on 1-5 scale, or null if invalid
 */
export function normalizeRatingForDisplay(rating: number | null | undefined): number | null {
  if (rating === null || rating === undefined) {
    return null;
  }
  
  console.log(`Normalizing rating for display: ${rating}`);
  
  // If rating is between 0-1, convert to 1-5 scale
  if (rating >= 0 && rating <= 1) {
    const normalizedRating = Math.round(rating * 5);
    console.log(`Converted ${rating} to ${normalizedRating} (0-1 to 1-5 scale)`);
    return normalizedRating;
  }
  
  // If already in 1-5 scale, just round it
  if (rating >= 1 && rating <= 5) {
    const roundedRating = Math.round(rating);
    console.log(`Rounded ${rating} to ${roundedRating} (already in 1-5 scale)`);
    return roundedRating;
  }
  
  // Fallback for unexpected values - clamp between 1-5
  const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));
  console.log(`Clamped unexpected rating ${rating} to ${clampedRating}`);
  return clampedRating;
}
