
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, Star, X } from "lucide-react";
import { BookRating } from "./BookRating";
import { useToast } from "@/hooks/use-toast";
import { rateBook } from "@/lib/nostr";
import { Book } from "@/lib/nostr/types";

interface BookCoverProps {
  isbn?: string;
  title: string;
  author?: string;
  coverUrl: string;
  isRead?: boolean;
  pendingAction?: string | null;
  onReadAction?: () => void;
  onRemoveAction?: () => void;
  readingStatus?: 'tbr' | 'reading' | 'finished' | null;
  size?: "xxsmall" | "xsmall" | "small" | "medium" | "large";
  rating?: number;
  onRatingChange?: (rating: number) => void;
}

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author = "",
  coverUrl,
  isRead = false,
  pendingAction = null,
  onReadAction = () => {},
  onRemoveAction,
  readingStatus,
  size = "medium",
  rating,
  onRatingChange
}) => {
  const { toast } = useToast();
  const [isRating, setIsRating] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const isFinished = isRead;
  
  // We're not using these fixed height classes anymore
  // Instead, we'll let the parent component (BookCard) handle the sizing
  const sizeClasses = {
    xxsmall: "",
    xsmall: "",
    small: "",
    medium: "",
    large: ""
  };

  const handleRateBook = async (newRating: number) => {
    if (!isbn) {
      toast({
        title: "Cannot rate book",
        description: "This book is missing an ISBN",
        variant: "destructive"
      });
      return;
    }
    
    setIsRating(true);
    
    try {
      if (onRatingChange) {
        onRatingChange(newRating);
      } else {
        // Fallback direct rating if no callback provided
        // Use the isbn string directly
        await rateBook(isbn, newRating);
        toast({
          title: "Rating saved",
          description: "Your rating has been saved and published to Nostr"
        });
      }
    } catch (error) {
      console.error("Error rating book:", error);
      toast({
        title: "Rating failed",
        description: "There was an error saving your rating",
        variant: "destructive"
      });
    } finally {
      setIsRating(false);
    }
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

  const renderRatingStars = () => {
    const starCount = 5;
    const displayRating = rating ? Math.round(rating * 5) : 0;
    const hoverRating = ratingHover !== null ? ratingHover : displayRating;
    
    return (
      <div 
        className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-full flex items-center"
        onMouseLeave={() => setRatingHover(null)}
      >
        {[...Array(starCount)].map((_, i) => (
          <button
            key={i}
            className="p-0.5"
            onClick={() => handleRateBook((i + 1) / 5)}
            onMouseEnter={() => setRatingHover(i + 1)}
            disabled={isRating}
            aria-label={`Rate ${i + 1} stars`}
          >
            <Star
              size={size === "large" ? 16 : 12}
              className={`
                ${i < hoverRating ? 'text-bookverse-highlight fill-bookverse-highlight' : 'text-white'}
                transition-colors
              `}
            />
          </button>
        ))}
      </div>
    );
  };

  const removeButton = () => {
    if (!onRemoveAction || !readingStatus) return null;
    
    return (
      <button
        onClick={onRemoveAction}
        className="absolute top-2 left-2 rounded-full p-1.5 transition-all duration-200 
          bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-red-500 hover:border-red-500"
        title={`Remove from ${readingStatus === 'tbr' ? 'TBR' : readingStatus === 'reading' ? 'reading' : 'finished'} list`}
      >
        {pendingAction === readingStatus ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </button>
    );
  };

  const actionButton = () => {
    if (isFinished) {
      // Show star rating for finished books
      return renderRatingStars();
    } else if (onReadAction) {
      // Show mark as read button for unfinished books
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
    }
    return null;
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
      {removeButton()}
      {actionButton()}
    </div>
  );
};
