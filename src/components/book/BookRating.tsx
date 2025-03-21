
import React from "react";
import { Star } from "lucide-react";

interface BookRatingProps {
  rating?: number;
}

export const BookRating: React.FC<BookRatingProps> = ({ rating }) => {
  if (rating === undefined) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }

  // Convert rating from 0-1 scale to 1-5 scale for display
  const displayRating = Math.round(rating * 5);

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
