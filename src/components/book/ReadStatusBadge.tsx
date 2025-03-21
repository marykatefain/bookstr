import React from "react";
import { Loader2, Check } from "lucide-react";

interface ReadStatusBadgeProps {
  isRead: boolean;
  pendingAction?: string | null;
  onReadAction?: () => void;
}

/**
 * A component for displaying read status badges
 */
export const ReadStatusBadge: React.FC<ReadStatusBadgeProps> = ({
  isRead,
  pendingAction = null,
  onReadAction
}) => {
  // If no action handler and not read, don't show anything
  if (!onReadAction && !isRead) {
    return null;
  }
  
  // If read, show check mark
  if (isRead) {
    return (
      <div
        className="absolute top-2 right-2 rounded-full p-1.5 bg-green-500 text-white"
        title="Read"
      >
        <Check className="h-4 w-4" />
      </div>
    );
  }
  
  // Otherwise show the read/check button
  return (
    <button
      onClick={onReadAction}
      className="absolute top-2 right-2 rounded-full p-1.5 transition-all duration-200 
        bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-green-500 hover:border-green-500"
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
