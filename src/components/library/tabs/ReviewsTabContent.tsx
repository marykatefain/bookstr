
import React from "react";
import { EmptyState } from "@/components/profile/EmptyState";
import { ReviewCard } from "@/components/ReviewCard";
import { BookReview } from "@/lib/nostr/types";

interface ReviewsTabContentProps {
  reviews: BookReview[];
  isLoading: boolean;
}

export const ReviewsTabContent: React.FC<ReviewsTabContentProps> = ({ reviews, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[250px]"></div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8">
        <EmptyState 
          title="No reviews yet" 
          description="You haven't written any book reviews yet"
          actionText="Explore books to review"
          actionType="explore"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((review) => (
        <ReviewCard 
          key={review.id} 
          review={review}
          bookTitle={review.bookTitle}
          showBookInfo={true}
        />
      ))}
    </div>
  );
};
