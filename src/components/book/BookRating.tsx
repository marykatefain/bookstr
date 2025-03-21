
import React, { useEffect } from "react";
import { Star } from "lucide-react";

interface BookRatingProps {
  rating?: number;
}

export const BookRating: React.FC<BookRatingProps> = ({ rating }) => {
  useEffect(() => {
    console.log(`BookRating component received rating:`, rating);
  }, [rating]);

  if (rating === undefined || rating === null) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }

  // Convert rating from 0-1 scale to 1-5 scale for display
  // Ensure it's a number and handle different scale formats
  let displayRating: number;
  
  if (typeof rating === 'number') {
    // If rating is between 0-1, convert to 1-5 scale
    if (rating >= 0 && rating <= 1) {
      displayRating = Math.round(rating * 5);
      console.log(`Converting rating from 0-1 scale (${rating}) to display rating: ${displayRating}`);
    } else if (rating >= 1 && rating <= 5) {
      // Already in 1-5 scale
      displayRating = Math.round(rating);
      console.log(`Rating already in 1-5 scale: ${displayRating}`);
    } else {
      // Fallback for unexpected values
      displayRating = Math.min(5, Math.max(1, Math.round(rating)));
      console.log(`Clamping unexpected rating value ${rating} to: ${displayRating}`);
    }
  } else {
    // Handle non-number ratings (shouldn't happen, but just in case)
    displayRating = 0;
    console.warn(`Received non-number rating: ${rating}, defaulting to 0`);
  }

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < displayRating 
              ? "text-bookverse-highlight fill-bookverse-highlight" 
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};
