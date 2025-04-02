
import React, { useState } from "react";
import { Book } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { Check, BookOpen, Star, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rateBook } from "@/lib/nostr";

interface BookStatusButtonProps {
  book: Book;
  pendingAction: string | null;
  onAddToTbr: () => void;
  onStartReading: () => void;
  onMarkAsRead: () => void;
  onRatingChange?: (rating: number) => void;
  onRemove?: () => void;
  horizontal?: boolean;
  size?: "small" | "medium" | "large";
}

export function BookStatusButton({
  book,
  pendingAction,
  onAddToTbr,
  onStartReading,
  onMarkAsRead,
  onRatingChange,
  onRemove,
  horizontal = false,
  size = "medium",
}: BookStatusButtonProps) {
  const { toast } = useToast();
  const [isRating, setIsRating] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const readingStatus = book.readingStatus?.status;
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';
  
  const rating = book.readingStatus?.rating;
  const displayRating = rating ? Math.round(rating * 5) : 0;

  const handleRating = async (newRating: number) => {
    if (!book.isbn) return;
    
    try {
      setIsRating(true);
      
      if (onRatingChange) {
        onRatingChange(newRating / 5); // Convert to 0-1 scale
      } else {
        await rateBook(book.isbn, newRating / 5);
        toast({
          title: "Rating saved",
          description: `You've rated "${book.title}" ${newRating} stars`
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
      setShowRating(false);
    }
  };

  // Determine button appearance based on reading status
  if (isFinished) {
    return (
      <div className="w-full space-y-2 relative">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-0"
            onClick={onRemove}
            disabled={pendingAction !== null}
            title="Remove from Read List"
          >
            {pendingAction ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-1 rounded-md flex items-center">
              <Check className="mr-1 h-3 w-3" />
              Read
            </div>
          </div>
          
          <div className="flex items-center">
            {showRating ? (
              <div className="flex bg-amber-50 dark:bg-amber-900/30 p-1 rounded-md">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={isRating}
                    onClick={() => handleRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= displayRating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => setShowRating(true)}
              >
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= displayRating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isReading) {
    return (
      <div className="w-full space-y-2 relative">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-0"
            onClick={onRemove}
            disabled={pendingAction !== null}
            title="Remove from Reading List"
          >
            {pendingAction ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        )}
        
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          size="sm"
          onClick={onMarkAsRead}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'finished' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="mr-1 h-4 w-4" />
          )}
          Mark as Read
        </Button>
      </div>
    );
  }

  if (isTbr) {
    return (
      <div className="w-full space-y-2 relative">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-0"
            onClick={onRemove}
            disabled={pendingAction !== null}
            title="Remove from TBR List"
          >
            {pendingAction ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        )}
        
        <Button
          className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
          size="sm"
          onClick={onStartReading}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'reading' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <BookOpen className="mr-1 h-4 w-4" />
          )}
          Start Reading
        </Button>
      </div>
    );
  }

  // Book is not in any list
  return (
    <div className="w-full space-y-2">
      <Button
        className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
        size="sm"
        onClick={onStartReading}
        disabled={pendingAction !== null}
      >
        {pendingAction === 'reading' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <BookOpen className="mr-1 h-4 w-4" />
        )}
        Start Reading
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onAddToTbr}
        disabled={pendingAction !== null}
      >
        {pendingAction === 'tbr' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Star className="mr-1 h-4 w-4" />
        )}
        Add to TBR
      </Button>
    </div>
  );
}
