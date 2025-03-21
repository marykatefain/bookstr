
import React from "react";
import { Star } from "lucide-react";
import { normalizeRatingForDisplay } from "@/lib/utils/ratingUtils";

interface RatingBadgeProps {
  rating: number | null | undefined;
  className?: string;
  size?: "small" | "medium" | "large";
}

/**
 * A component for displaying book ratings
 */
export const RatingBadge: React.FC<RatingBadgeProps> = ({ 
  rating,
  className = "",
  size = "medium"
}) => {
  if (rating === null || rating === undefined) {
    return null;
  }

  // Normalize the rating for display (converts from 0-1 scale to 1-5 scale if needed)
  const displayRating = normalizeRatingForDisplay(rating);
  
  if (displayRating === null) {
    return null;
  }
  
  const sizeClasses = {
    small: "px-1.5 py-0.5",
    medium: "px-2 py-1",
    large: "px-3 py-1.5"
  };
  
  const starSizeClasses = {
    small: "h-2.5 w-2.5",
    medium: "h-3 w-3",
    large: "h-4 w-4"
  };
  
  const textSizeClasses = {
    small: "text-[10px]",
    medium: "text-xs",
    large: "text-sm"
  };
  
  return (
    <div
      className={`absolute top-2 right-2 rounded-full ${sizeClasses[size]} bg-yellow-500 text-white flex items-center gap-1 ${className}`}
      title={`Rated ${displayRating}/5 stars`}
    >
      <Star className={`${starSizeClasses[size]} fill-white`} />
      <span className={`${textSizeClasses[size]} font-medium`}>{displayRating}</span>
    </div>
  );
};
