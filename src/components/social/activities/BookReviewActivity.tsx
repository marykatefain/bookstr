
import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface BookReviewActivityProps {
  userName: string;
  userPubkey: string;
  bookTitle: string;
  bookIsbn: string;
  rating?: number;
  content?: string;
}

export function BookReviewActivity({ 
  userName, 
  userPubkey, 
  bookTitle, 
  bookIsbn, 
  rating, 
  content 
}: BookReviewActivityProps) {
  // Convert rating from 0-1 scale to 1-5 scale
  const displayRating = rating !== undefined ? Math.round(rating * 5) : undefined;
  
  return (
    <div>
      <p>
        <Link to={`/user/${userPubkey}`} className="font-medium hover:underline">
          {userName}
        </Link>{' '}
        reviewed{' '}
        <Link to={`/book/${bookIsbn}`} className="font-medium hover:underline">
          {bookTitle}
        </Link>
      </p>
      {displayRating && (
        <div className="flex items-center mt-1">
          {Array(5).fill(0).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${index < displayRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
            />
          ))}
        </div>
      )}
      {content && (
        <p className="mt-2 text-sm text-muted-foreground">
          {content.length > 150 
            ? `${content.substring(0, 150)}...` 
            : content}
        </p>
      )}
    </div>
  );
}
