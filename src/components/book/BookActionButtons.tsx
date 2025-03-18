
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Loader2 } from "lucide-react";

interface BookActionButtonsProps {
  size: "small" | "medium" | "large";
  pendingAction: string | null;
  onAddToTbr: () => void;
  onStartReading: () => void;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  size,
  pendingAction,
  onAddToTbr,
  onStartReading
}) => {
  const getTbrButtonText = () => {
    return size === "small" ? "TBR" : "To Be Read";
  };

  const getStartReadingButtonText = () => {
    return size === "small" ? "Start" : "Start Reading";
  };

  return (
    <div className="pt-2 flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 text-xs md:text-sm"
        onClick={onAddToTbr}
        disabled={!!pendingAction}
      >
        {pendingAction === 'want-to-read' ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <PlusCircle className="mr-1 h-4 w-4" />
        )}
        {getTbrButtonText()}
      </Button>
      <Button
        size="sm"
        className="flex-1 text-xs md:text-sm bg-bookverse-accent hover:bg-bookverse-highlight"
        onClick={onStartReading}
        disabled={!!pendingAction}
      >
        {pendingAction === 'reading' ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <BookOpen className="mr-1 h-4 w-4" />
        )}
        {getStartReadingButtonText()}
      </Button>
    </div>
  );
};
