
import React, { useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import { BookReview } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UserReviewsTabProps {
  reviews: BookReview[];
}

export const UserReviewsTab: React.FC<UserReviewsTabProps> = ({ reviews }) => {
  const [revealedSpoilers, setRevealedSpoilers] = useState<{[key: string]: boolean}>({});
  
  const toggleSpoiler = (reviewId: string) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reviews</h2>
      
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews written yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(review => {
            const hasSpoiler = review.isSpoiler;
            const isRevealed = revealedSpoilers[review.id];
            
            if (hasSpoiler && !isRevealed) {
              return (
                <div key={review.id} className="border rounded-lg p-4 h-full flex flex-col">
                  <div className="flex gap-3 mb-2">
                    {review.bookCover && (
                      <img 
                        src={review.bookCover} 
                        alt={review.bookTitle || "Book cover"} 
                        className="h-16 w-12 object-cover rounded-sm"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    )}
                    <div className="flex flex-col justify-center">
                      <h3 className="font-medium line-clamp-2">
                        {review.bookTitle}
                      </h3>
                      {review.bookAuthor && (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          by {review.bookAuthor}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md flex-grow flex flex-col items-center justify-center text-center my-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mb-2" />
                    <p className="text-sm font-medium mb-2">This review contains spoilers</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleSpoiler(review.id)}
                    >
                      Reveal Content
                    </Button>
                  </div>
                </div>
              );
            }
            
            return (
              <ReviewCard 
                key={review.id} 
                review={review}
                bookTitle={review.bookTitle}
                showBookInfo={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
