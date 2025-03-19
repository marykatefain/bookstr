
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Loader2, Check, X } from "lucide-react";

interface BookActionButtonsProps {
  size: "small" | "medium" | "large";
  pendingAction: string | null;
  onAddToTbr: () => void;
  onStartReading: () => void;
  onRemove?: (listType: 'tbr' | 'reading' | 'finished') => void;
  readingStatus?: 'tbr' | 'reading' | 'finished' | null;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  size,
  pendingAction,
  onAddToTbr,
  onStartReading,
  onRemove,
  readingStatus
}) => {
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';

  // Determine which buttons to show based on reading status
  const showActionButtons = !isFinished;
  const showUnmarkButton = isFinished;

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

  if (isFinished) {
    return (
      <div className="pt-2">
        <Button
          size="sm"
          variant="default"
          className="w-full text-xs bg-bookverse-highlight"
          onClick={handleUnmarkClick}
          disabled={!!pendingAction}
        >
          {pendingAction === 'finished' ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <X className="mr-1 h-3 w-3" />
          )}
          Unmark as Read
        </Button>
      </div>
    );
  }

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
        {isReading ? "Remove" : "Start"}
      </Button>
    </div>
  );
};
