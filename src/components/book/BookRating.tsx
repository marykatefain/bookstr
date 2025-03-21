
import React from "react";
import { Star } from "lucide-react";

interface BookRatingProps {
  rating?: number;
}

export const BookRating: React.FC<BookRatingProps> = ({ rating }) => {
  // Add detailed debug logging to see what rating values are coming in
  console.log(`BookRating component received rating: ${rating} (type: ${typeof rating})`);
  
  if (rating === undefined || rating === null) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }

  // Ensure rating is in valid range (0-1)
  const normalizedRating = typeof rating === 'number' && rating >= 0 && rating <= 1 
    ? rating 
    : typeof rating === 'number' && rating > 1 && rating <= 5
      ? rating / 5  // Convert from 5-star scale if needed
      : 0;
  
  // Convert rating from 0-1 scale to 1-5 scale for display
  const displayRating = Math.round(normalizedRating * 5);
  console.log(`Displaying rating: ${displayRating} stars (from normalized value: ${normalizedRating})`);

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
