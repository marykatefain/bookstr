import React, { useState } from "react";
import { Book } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { Check, BookOpen, Star, Loader2 } from "lucide-react";
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
    // Different layout for horizontal mode
    if (horizontal) {
      return (
        <div className="w-full">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-1 rounded-md flex items-center mr-2">
              <Check className="mr-1 h-3 w-3" />
              Read
            </div>
            
            <div className="flex ml-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= displayRating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                  onClick={() => setShowRating(true)}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
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
    // Different layout for horizontal mode
    if (horizontal) {
      return (
        <div className="w-full">
          <Button
            className="w-full flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
            onClick={onMarkAsRead}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'finished' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className={`${size === 'small' ? 'sr-only' : 'ml-1 text-xs'}`}>Read</span>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <div className="flex gap-1">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
            onClick={onMarkAsRead}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'finished' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">Mark as Read</span>
          </Button>
        </div>
      </div>
    );
  }

  if (isTbr) {
    // Different layout for horizontal mode
    if (horizontal) {
      return (
        <div className="w-full">
          <Button
            className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
            size="sm"
            onClick={onStartReading}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'reading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            <span className={`${size === 'small' ? 'sr-only' : 'ml-1 text-xs'}`}>Start</span>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <div className="flex gap-1">
          <Button
            className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
            size="sm"
            onClick={onStartReading}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'reading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">Start Reading</span>
          </Button>
        </div>
      </div>
    );
  }

  // Book is not in any list
  // For horizontal layout, adjust the grid for better appearance
  if (horizontal) {
    return (
      <div className="w-full">
        <div className="flex gap-1">
          <Button
            className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
            size="sm"
            onClick={onStartReading}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'reading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            <span className={`${size === 'small' ? 'sr-only' : 'ml-1 text-xs'}`}>Start</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAsRead}
            disabled={pendingAction !== null}
            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:border-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            {pendingAction === 'finished' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="sr-only">Read</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      <Button
        variant="outline"
        size="sm"
        className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:border-green-800 dark:text-green-400 dark:hover:text-green-300"
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
      
      <div className="grid grid-cols-2 gap-1">
        <Button
          className="bg-bookverse-accent hover:bg-bookverse-highlight"
          size="sm"
          onClick={onStartReading}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'reading' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <BookOpen className="mr-1 h-4 w-4" />
          )}
          Start
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onAddToTbr}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'tbr' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Star className="mr-1 h-4 w-4" />
          )}
          TBR
        </Button>
      </div>
    </div>
  );
}