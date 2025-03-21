import React from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, Star } from "lucide-react";

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

  const renderActionButton = () => {
    // Not displaying any button if there's no action handler
    if (!onReadAction && !isRead && !userRating) return null;
    
    // If the book has a rating and is read, show the rating
    if (isRead && userRating && userRating > 0) {
      return (
        <div
          className="absolute top-2 right-2 rounded-full px-2 py-1 bg-yellow-500 text-white flex items-center gap-1"
          title={`You rated this ${Math.round(userRating * 5)}/5 stars`}
        >
          <Star className="h-3 w-3 fill-white" />
          <span className="text-xs font-medium">{Math.round(userRating * 5)}</span>
        </div>
      );
    }
    
    // Otherwise show the read/check button
    return (
      <button
        onClick={onReadAction}
        className={`absolute top-2 right-2 rounded-full p-1.5 transition-all duration-200 
          ${isRead 
            ? "bg-green-500 text-white" 
            : "bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-green-500 hover:border-green-500"}`}
        title="Mark as read"
      >
        {pendingAction === 'finished' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>
    );
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
      {renderActionButton()}
    </div>
  );
};
