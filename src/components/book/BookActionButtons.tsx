
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Loader2, Check } from "lucide-react";

interface BookActionButtonsProps {
  size: "small" | "medium" | "large";
  pendingAction: string | null;
  onAddToTbr: () => void;
  onStartReading: () => void;
  readingStatus?: 'want-to-read' | 'reading' | 'finished' | null;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  size,
  pendingAction,
  onAddToTbr,
  onStartReading,
  readingStatus
}) => {
  const isTbr = readingStatus === 'want-to-read' || readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';

  return (
    <div className="pt-2 flex items-center gap-2">
      <Button
        size="sm"
        variant={isTbr ? "default" : "outline"}
        className={`flex-1 text-xs ${isTbr ? "bg-bookverse-highlight" : ""}`}
        onClick={onAddToTbr}
        disabled={!!pendingAction}
      >
        {pendingAction === 'want-to-read' || pendingAction === 'tbr' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : isTbr ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <PlusCircle className="mr-1 h-3 w-3" />
        )}
        {isTbr ? "On TBR" : "TBR"}
      </Button>
      <Button
        size="sm"
        className={`flex-1 text-xs ${isReading ? "bg-bookverse-highlight" : "bg-bookverse-accent hover:bg-bookverse-highlight"}`}
        onClick={onStartReading}
        disabled={!!pendingAction}
      >
        {pendingAction === 'reading' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : isReading ? (
          <Check className="mr-1 h-3 w-3" />
        ) : (
          <BookOpen className="mr-1 h-3 w-3" />
        )}
        {isReading ? "Reading" : "Start"}
      </Button>
    </div>
  );
};
