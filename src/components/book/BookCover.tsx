
import React from "react";
import { Link } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import { ReadStatusBadge } from "./ReadStatusBadge";

interface BookCoverProps {
  isbn?: string;
  title: string;
  author?: string;
  coverUrl: string;
  isRead?: boolean;
  pendingAction?: string | null;
  onReadAction?: () => void;
  size?: "xxsmall" | "xsmall" | "small" | "medium" | "large";
  userRating?: number | null;
}

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author = "",
  coverUrl,
  isRead = false,
  pendingAction = null,
  onReadAction = () => {},
  size = "medium",
  userRating = null
}) => {
  console.log(`BookCover rendering - ${title}, rating: ${userRating}, isRead: ${isRead}`);
  
  // We're not using these fixed height classes anymore
  // Instead, we'll let the parent component (BookCard) handle the sizing
  const sizeClasses = {
    xxsmall: "",
    xsmall: "",
    small: "",
    medium: "",
    large: ""
  };

  const coverElement = (
    <div className="w-full h-full">
      <img
        src={coverUrl}
        alt={`${title} by ${author}`}
        className="object-cover w-full h-full rounded-t-lg book-cover"
        onError={(e) => {
          e.currentTarget.src = "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
        }}
      />
    </div>
  );

  const mapSize = (size: string): "small" | "medium" | "large" => {
    if (size === "xxsmall" || size === "xsmall") return "small";
    if (size === "large") return "large";
    return "medium";
  };

  return (
    <div className={`relative w-full h-full`}>
      {isbn ? (
        <Link to={`/book/${isbn}`} className="block h-full w-full">
          {coverElement}
        </Link>
      ) : (
        coverElement
      )}
      
      {/* Show rating badge if book is read and has a rating */}
      {isRead && userRating !== null && userRating !== undefined ? (
        <RatingBadge rating={userRating} size={mapSize(size)} />
      ) : (
        <ReadStatusBadge 
          isRead={isRead}
          pendingAction={pendingAction}
          onReadAction={onReadAction}
        />
      )}
    </div>
  );
};
