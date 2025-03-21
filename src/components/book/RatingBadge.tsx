
import React from "react";
import { Star } from "lucide-react";
import { normalizeRatingForDisplay } from "@/lib/utils/ratingUtils";

interface RatingBadgeProps {
  rating: number | null;
}

/**
 * A component for displaying book ratings
 */
export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating }) => {
  if (rating === null || rating === undefined) {
    return null;
  }

  // Normalize the rating for display
  const displayRating = normalizeRatingForDisplay(rating);
  
  if (displayRating === null) {
    return null;
  }
  
  return (
    <div
      className="absolute top-2 right-2 rounded-full px-2 py-1 bg-yellow-500 text-white flex items-center gap-1"
      title={`Rated ${displayRating}/5 stars`}
    >
      <Star className="h-3 w-3 fill-white" />
      <span className="text-xs font-medium">{displayRating}</span>
    </div>
  );
};
