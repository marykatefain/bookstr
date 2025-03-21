
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Loader2, Check, X } from "lucide-react";
import { Book, BookActionType } from "@/lib/nostr/types";
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
  const { toast } = useToast();
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';

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

  // If the book is marked as read, show only the unmark button
  if (isFinished) {
    return (
      <div className="pt-2 w-full">
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

  // For books on TBR or currently reading, show both buttons side by side with full width
  return (
    <div className="pt-2 grid grid-cols-2 gap-2 w-full">
      <Button
        size="sm"
        variant={isTbr ? "default" : "outline"}
        className={`text-xs ${isTbr ? "bg-bookverse-highlight" : ""} w-full`}
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
        className={`text-xs ${isReading ? "bg-bookverse-highlight" : "bg-bookverse-accent hover:bg-bookverse-highlight"} w-full`}
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
