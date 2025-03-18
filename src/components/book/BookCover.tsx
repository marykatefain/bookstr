
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
    xxsmall: "h-12",
    xsmall: "h-24",
    small: "h-32",
    medium: "h-48",
    large: "h-64"
  };

  const coverElement = (
    <div className="w-full h-full">
      <img
        src={coverUrl}
        alt={`${title} by ${author}`}
        className="object-cover w-full h-full rounded-t-lg book-cover"
        onError={(e) => {
          e.currentTarget.src = "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
        }}
      />
    </div>
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
    <div className={`relative ${sizeClasses[size]} w-full`}>
      {isbn ? (
        <Link to={`/book/${isbn}`} className="block h-full w-full">
          {coverElement}
        </Link>
      ) : (
        coverElement
      )}
      {actionButton}
    </div>
  );
};
