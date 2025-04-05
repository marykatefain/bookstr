
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ExternalLink } from "lucide-react";
import { Rating } from "@/lib/utils/Rating";

interface BookReviewActivityProps {
  userName: string;
  userPubkey: string;
  bookTitle: string;
  bookIsbn: string;
  bookCover?: string;
  rating?: Rating;
  content?: string;
  reviewId?: string;
}

export function BookReviewActivity({ 
  userName, 
  userPubkey, 
  bookTitle, 
  bookIsbn, 
  bookCover,
  rating, 
  content,
  reviewId
}: BookReviewActivityProps) {
  const [imageError, setImageError] = useState(false);
  
  // Convert rating to 0-5 scale for display
  const displayRating = rating ? rating.toScale(5) : undefined;
  
  return (
    <div className="flex gap-3">
      {bookCover && !imageError && (
        <Link to={`/book/${bookIsbn}`} className="shrink-0">
          <img 
            src={bookCover} 
            alt={bookTitle} 
            className="h-16 w-12 object-cover rounded-sm"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </Link>
      )}
      <div className="w-full">
        <div className="flex justify-between items-start">
          <p>
            <Link to={`/user/${userPubkey}`} className="font-medium hover:underline">
              {userName}
            </Link>{' '}
            reviewed{' '}
            <Link to={`/book/${bookIsbn}`} className="font-medium hover:underline">
              {bookTitle}
            </Link>
          </p>
          {reviewId && (
            <Link 
              to={`/review/${reviewId}`} 
              className="text-muted-foreground hover:text-bookverse-accent ml-2" 
              title="View full review"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
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
    </div>
  );
}
