
import React from "react";
import { Link } from "react-router-dom";

interface BookCoverPreviewProps {
  isbn: string;
  title: string;
  coverUrl: string;
}

export function BookCoverPreview({ isbn, title, coverUrl }: BookCoverPreviewProps) {
  // Generate a fallback route that will work even if ISBN is missing
  const bookRoute = isbn 
    ? `/book/${isbn}` 
    : `/book/search?title=${encodeURIComponent(title)}`;

  return (
    <Link to={bookRoute} className="shrink-0">
      <div className="w-16 h-24 rounded overflow-hidden shadow-sm bg-gray-100">
        <img 
          src={coverUrl || '/placeholder.svg'} 
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log(`Image error loading: ${coverUrl}`);
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
      </div>
    </Link>
  );
}
