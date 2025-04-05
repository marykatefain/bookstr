
import React from "react";
import { Star } from "lucide-react";
import { Rating } from "@/lib/utils/Rating";

interface BookRatingProps {
  rating?: Rating;
  readingStatus?: 'tbr' | 'reading' | 'finished';
}

export const BookRating: React.FC<BookRatingProps> = ({ rating, readingStatus }) => {
  // Hide rating if the book is finished
  if (readingStatus === 'finished') {
    return null;
  }

  if (!rating) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }
  
  // Convert rating to display scale (1-5)
  const displayRating = rating.toScale(5);
  
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
