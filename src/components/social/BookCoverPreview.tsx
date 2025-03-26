
import React from "react";
import { Link } from "react-router-dom";

interface BookCoverPreviewProps {
  isbn: string;
  title: string;
  coverUrl: string;
}

export function BookCoverPreview({ isbn, title, coverUrl }: BookCoverPreviewProps) {
  return (
    <Link to={`/book/${isbn}`} className="shrink-0">
      <div className="w-16 h-24 rounded overflow-hidden shadow-sm bg-gray-100">
        <img 
          src={coverUrl} 
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
