
import React from "react";
import { ReviewCard } from "@/components/ReviewCard";
import { BookReview } from "@/lib/nostr/types";

interface UserReviewsTabProps {
  reviews: BookReview[];
}

export const UserReviewsTab: React.FC<UserReviewsTabProps> = ({ reviews }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reviews</h2>
      
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews written yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review}
              bookTitle={review.bookTitle}
              showBookInfo={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
