
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
  return (
    <div className="pt-2 flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 text-xs"
        onClick={onAddToTbr}
        disabled={!!pendingAction}
      >
        {pendingAction === 'want-to-read' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <PlusCircle className="mr-1 h-3 w-3" />
        )}
        TBR
      </Button>
      <Button
        size="sm"
        className="flex-1 text-xs bg-bookverse-accent hover:bg-bookverse-highlight"
        onClick={onStartReading}
        disabled={!!pendingAction}
      >
        {pendingAction === 'reading' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <BookOpen className="mr-1 h-3 w-3" />
        )}
        Start
      </Button>
    </div>
  );
};
