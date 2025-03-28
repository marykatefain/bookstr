
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface BookCoverPreviewProps {
  isbn: string;
  title: string;
  coverUrl: string;
}

export function BookCoverPreview({ isbn, title, coverUrl }: BookCoverPreviewProps) {
  const [imageError, setImageError] = useState(false);
  
  // Generate a fallback route that will work even if ISBN is missing
  const bookRoute = isbn 
    ? `/book/${isbn}` 
    : `/book/search?title=${encodeURIComponent(title)}`;

  return (
    <Link to={bookRoute} className="shrink-0">
      <div className="w-16 h-24 rounded overflow-hidden shadow-sm bg-gray-100">
        {coverUrl && !imageError ? (
          <img 
            src={coverUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log(`Image error loading: ${coverUrl}`);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center p-1">
              <p className="text-xs font-medium text-gray-600 line-clamp-2">{title}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
