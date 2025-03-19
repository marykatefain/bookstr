
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Loader2, Check, X, Star } from "lucide-react";
import { Book, BookActionType } from "@/lib/nostr/types";
import { rateBook } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

interface BookActionButtonsProps {
  size: "small" | "medium" | "large";
  pendingAction: string | null;
  onAddToTbr: () => void;
  onStartReading: () => void;
  onRemove?: (listType: 'tbr' | 'reading' | 'finished') => void;
  readingStatus?: 'tbr' | 'reading' | 'finished' | null;
  book?: Book;
  onUpdate?: () => void;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  size,
  pendingAction,
  onAddToTbr,
  onStartReading,
  onRemove,
  readingStatus,
  book,
  onUpdate
}) => {
  const [isRating, setIsRating] = useState(false);
  const { toast } = useToast();
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';

  // Get user rating (convert from 0-1 scale to 1-5 scale)
  const userRating = book?.readingStatus?.rating !== undefined 
    ? Math.round(book.readingStatus.rating * 5) 
    : 0;

  const handleTbrClick = () => {
    if (isTbr && onRemove) {
      onRemove('tbr');
    } else {
      onAddToTbr();
    }
  };

  const handleReadingClick = () => {
    if (isReading && onRemove) {
      onRemove('reading');
    } else {
      onStartReading();
    }
  };

  const handleUnmarkClick = () => {
    if (isFinished && onRemove) {
      onRemove('finished');
    }
  };

  const handleRating = async (rating: number) => {
    if (!book || !book.isbn) return;
    
    try {
      setIsRating(true);
      await rateBook(book, rating / 5); // Convert 1-5 to 0-1 scale
      
      toast({
        title: "Rating submitted",
        description: `You've rated "${book.title}" ${rating} stars.`
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error rating book:", error);
      toast({
        title: "Error",
        description: "Could not submit rating",
        variant: "destructive"
      });
    } finally {
      setIsRating(false);
    }
  };

  // If the book is marked as read, show rating stars and the unmark button
  if (isFinished) {
    return (
      <div className="pt-2">
        <div className="flex justify-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => !isRating && book && handleRating(star)}
              className={`h-4 w-4 cursor-pointer ${
                isRating ? 'opacity-50' : ''
              } ${
                star <= userRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs text-muted-foreground hover:bg-muted/50"
          onClick={handleUnmarkClick}
          disabled={!!pendingAction}
        >
          {pendingAction === 'finished' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <X className="mr-1 h-3 w-3" />
          )}
          Mark Unread
        </Button>
      </div>
    );
  }

  // For books on TBR or currently reading, show both buttons side by side
  return (
    <div className="pt-2 flex items-center gap-2">
      <Button
        size="sm"
        variant={isTbr ? "default" : "outline"}
        className={`flex-1 text-xs ${isTbr ? "bg-bookverse-highlight" : ""}`}
        onClick={handleTbrClick}
        disabled={!!pendingAction}
      >
        {pendingAction === 'tbr' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : isTbr ? (
          <X className="mr-1 h-3 w-3" />
        ) : (
          <PlusCircle className="mr-1 h-3 w-3" />
        )}
        {isTbr ? "Remove" : "TBR"}
      </Button>
      <Button
        size="sm"
        className={`flex-1 text-xs ${isReading ? "bg-bookverse-highlight" : "bg-bookverse-accent hover:bg-bookverse-highlight"}`}
        onClick={handleReadingClick}
        disabled={!!pendingAction}
      >
        {pendingAction === 'reading' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : isReading ? (
          <X className="mr-1 h-3 w-3" />
        ) : (
          <BookOpen className="mr-1 h-3 w-3" />
        )}
        {isReading ? "Stop" : "Start"}
      </Button>
    </div>
  );
};
