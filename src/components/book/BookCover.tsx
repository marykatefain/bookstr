
import React from "react";
import { Link } from "react-router-dom";
import { Loader2, Check } from "lucide-react";

interface BookCoverProps {
  isbn: string;
  title: string;
  author: string;
  coverUrl: string;
  isRead: boolean;
  pendingAction: string | null;
  onReadAction: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author,
  coverUrl,
  isRead,
  pendingAction,
  onReadAction
}) => {
  return (
    <div className="relative aspect-[2/3] overflow-hidden">
      <Link to={`/book/${isbn}`}>
        <img
          src={coverUrl}
          alt={`${title} by ${author}`}
          className="object-cover w-full h-full cursor-pointer book-cover"
          onError={(e) => {
            e.currentTarget.src = "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
          }}
        />
      </Link>
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
    </div>
  );
};
