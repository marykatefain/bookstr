
import React, { useState, useEffect } from "react";
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
  const [localRating, setLocalRating] = useState(0);
  const { toast } = useToast();
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';

  useEffect(() => {
    if (book?.readingStatus?.rating !== undefined) {
      setLocalRating(Math.round(book.readingStatus.rating * 5));
    } else {
      setLocalRating(0);
    }
  }, [book?.readingStatus?.rating]);

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
      setLocalRating(rating);
      
      const normalizedRating = rating / 5;
      await rateBook(book, normalizedRating);
      
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
      if (book.readingStatus?.rating !== undefined) {
        setLocalRating(Math.round(book.readingStatus.rating * 5));
      }
    } finally {
      setIsRating(false);
    }
  };

  if (isFinished) {
    return (
      <div className="pt-2 w-full">
        <div className="flex justify-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => !isRating && book && handleRating(star)}
              className={`h-4 w-4 cursor-pointer ${
                isRating ? 'opacity-50' : ''
              } ${
                star <= localRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="w-full flex justify-center">
          <Button
            size="sm"
            variant="outline"
            className="w-[200%] text-xs text-muted-foreground hover:bg-muted/50"
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
      </div>
    );
  }

  return (
    <div className="pt-2 flex flex-col gap-2 w-full">
      {/* For TBR books, show only Start Reading button */}
      {isTbr && (
        <Button
          size="sm"
          className="text-xs bg-bookverse-accent hover:bg-bookverse-highlight w-full"
          onClick={handleReadingClick}
          disabled={!!pendingAction}
        >
          {pendingAction === 'reading' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <BookOpen className="mr-1 h-3 w-3" />
          )}
          Start Reading
        </Button>
      )}

      {/* For Reading books, show only Add to TBR button */}
      {isReading && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs w-full"
          onClick={handleTbrClick}
          disabled={!!pendingAction}
        >
          {pendingAction === 'tbr' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <PlusCircle className="mr-1 h-3 w-3" />
          )}
          Add to TBR
        </Button>
      )}

      {/* For books not in any list, show both buttons */}
      {!isTbr && !isReading && !isFinished && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-xs w-full"
            onClick={handleTbrClick}
            disabled={!!pendingAction}
          >
            {pendingAction === 'tbr' ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <PlusCircle className="mr-1 h-3 w-3" />
            )}
            Add to TBR
          </Button>
          <Button
            size="sm"
            className="text-xs bg-bookverse-accent hover:bg-bookverse-highlight w-full"
            onClick={handleReadingClick}
            disabled={!!pendingAction}
          >
            {pendingAction === 'reading' ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <BookOpen className="mr-1 h-3 w-3" />
            )}
            Start Reading
          </Button>
        </>
      )}
    </div>
  );
}
