
import React from "react";
import { Link } from "react-router-dom";
import { Loader2, Check } from "lucide-react";

interface BookCoverProps {
  isbn?: string;
  title: string;
  author?: string;
  coverUrl: string;
  isRead?: boolean;
  pendingAction?: string | null;
  onReadAction?: () => void;
  size?: "xxsmall" | "xsmall" | "small" | "medium" | "large";
}

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author = "",
  coverUrl,
  isRead = false,
  pendingAction = null,
  onReadAction = () => {},
  size = "medium"
}) => {
  const sizeClasses = {
    xxsmall: "max-h-12",
    xsmall: "max-h-24",
    small: "max-h-32",
    medium: "max-h-48",
    large: "max-h-64"
  };

  const coverElement = (
    <img
      src={coverUrl}
      alt={`${title} by ${author}`}
      className={`object-cover w-full h-full ${sizeClasses[size]} book-cover`}
      onError={(e) => {
        e.currentTarget.src = "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
      }}
    />
  );

  const actionButton = isRead || onReadAction ? (
    <button
      onClick={onReadAction}
      className={`absolute top-2 right-2 rounded-full p-1.5 transition-all duration-200 
        ${isRead 
          ? "bg-green-500 text-white" 
          : "bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-green-500 hover:border-green-500"}`}
      title="Mark as read"
    >
      {pendingAction === 'read' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </button>
  ) : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="aspect-[2/3] h-full w-full">
        {isbn ? (
          <Link to={`/book/${isbn}`} className="block h-full w-full">
            {coverElement}
          </Link>
        ) : (
          coverElement
        )}
      </div>
      {actionButton}
    </div>
  );
};
