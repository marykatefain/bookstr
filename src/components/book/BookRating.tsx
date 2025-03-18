
import React from "react";
import { Star } from "lucide-react";

interface BookRatingProps {
  rating?: number;
}

export const BookRating: React.FC<BookRatingProps> = ({ rating }) => {
  if (!rating) {
    return <span className="text-xs text-muted-foreground">No ratings yet</span>;
  }

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < (rating || 0) 
              ? "text-bookverse-highlight fill-bookverse-highlight" 
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};
