
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, Star, X } from "lucide-react";
import { BookRating } from "./BookRating";
import { useToast } from "@/hooks/use-toast";
import { reviewBook, fetchBookReviews, getCurrentUser } from "@/lib/nostr";
import { Book } from "@/lib/nostr/types";
import { Skeleton } from "@/components/ui/skeleton";
import { convertRawRatingToDisplayRating } from "@/lib/utils/ratings";

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
  book?: Book;
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
  onRatingChange,
  book
}) => {
  const { toast } = useToast();
  const [isRating, setIsRating] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(!!coverUrl && coverUrl !== "");
  const [imageError, setImageError] = useState(false);
  const isFinished = isRead || readingStatus === 'finished';
  
  const sizeClasses = {
    xxsmall: "",
    xsmall: "",
    small: "",
    medium: "",
    large: ""
  };

  const handleRateBook = async (newRating: number) => {
    const bookIsbn = isbn || book?.isbn;
    
    if (!bookIsbn) {
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
        let existingContent = '';
        
        try {
          const reviews = await fetchBookReviews(bookIsbn);
          if (reviews.length > 0) {
            const currentUser = getCurrentUser();
            if (currentUser) {
              const userPreviousReview = reviews.find(r => r.pubkey === currentUser.pubkey);
              
              if (userPreviousReview && userPreviousReview.content && userPreviousReview.content.trim()) {
                console.log("Found previous review content, preserving it:", userPreviousReview.content);
                existingContent = userPreviousReview.content;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching previous reviews:", error);
        }
        
        // Create a complete Book object with all required properties
        const bookObj: Book = book || {
          id: `isbn:${bookIsbn}`,
          isbn: bookIsbn,
          title: title || `Book (ISBN: ${bookIsbn})`,
          author: author || "Unknown Author",
          coverUrl: coverUrl || ""
        };
        
        await reviewBook(bookObj, existingContent, newRating);
        
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
    <div className="w-full h-full relative">
      {(!imageLoaded || imageError) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-t-lg">
          {!imageError ? (
            <Skeleton className="w-full h-full rounded-t-lg" />
          ) : (
            <div className="text-center p-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-3">{title}</p>
              {author && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{author}</p>}
            </div>
          )}
        </div>
      )}
      <img
        src={coverUrl || ""}
        alt={`${title} by ${author}`}
        className={`object-cover w-full h-full rounded-t-lg book-cover ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.log(`Image error loading: ${coverUrl}`);
          setImageError(true);
          setImageLoaded(true);
        }}
        loading="lazy"
      />
    </div>
  );

  const renderRatingStars = () => {
    const starCount = 5;
    
    const hoverRating = ratingHover !== null 
      ? ratingHover 
      : rating;
        
    return (
      <div 
        className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-full flex items-center"
        onMouseLeave={() => setRatingHover(null)}
      >
        {[...Array(starCount)].map((_, i) => (
          <button
            key={i}
            className="p-0.5"
            onClick={() => handleRateBook((i + 1))}
            onMouseEnter={() => setRatingHover(i + 1)}
            disabled={isRating}
            aria-label={`Rate ${i + 1} stars`}
          >
            <Star
              size={size === "large" ? 16 : 12}
              className={`
                ${i < (hoverRating || 0) ? 'text-bookverse-highlight fill-bookverse-highlight' : 'text-white'}
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
      return renderRatingStars();
    } else if (onReadAction) {
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

export const BookReadButton: React.FC<{
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
}> = ({ isRead, pendingAction, handleMarkAsRead }) => {
  return (
    <button
      onClick={handleMarkAsRead}
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
