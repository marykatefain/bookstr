
import React from "react";
import { Star } from "lucide-react";
import { convertRawRatingToDisplayRating } from "@/lib/utils/ratings";

interface BookRatingProps {
  rating?: number;
  readingStatus?: 'tbr' | 'reading' | 'finished';
}

export const BookRating: React.FC<BookRatingProps> = ({ rating, readingStatus }) => {
  // Hide rating if the book is finished
  if (readingStatus === 'finished') {
    return null;
  }

  if (!rating && rating !== 0) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }
  
  // Convert raw rating (0-1 scale) to display rating (1-5 scale)
  const displayRating = convertRawRatingToDisplayRating(rating);
  
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < (displayRating || 0)
              ? "text-bookverse-highlight fill-bookverse-highlight" 
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};
