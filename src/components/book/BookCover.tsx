
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/nostr/types";
import { Skeleton } from "@/components/ui/skeleton";

interface BookCoverProps {
  isbn?: string;
  title: string;
  author?: string;
  coverUrl: string;
  size?: "xxsmall" | "xsmall" | "small" | "medium" | "large";
  book?: Book;
}

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author = "",
  coverUrl,
  size = "medium",
  book
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (coverUrl) {
      setImageLoaded(false);
      setImageError(false);
    } else {
      setImageError(true);
    }
  }, [coverUrl]);

  const coverElement = (
    <div className="w-full h-full relative">
      {(!imageLoaded || imageError) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-t-lg">
          {!imageError ? (
            <Skeleton className="w-full h-full rounded-t-lg" />
          ) : (
            <div className="text-center p-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-3">{title}</p>
              {author && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{author}</p>}
            </div>
          )}
        </div>
      )}
      {coverUrl && !imageError && (
        <img
          src={coverUrl}
          alt={`${title} by ${author}`}
          className={`object-cover w-full h-full rounded-t-lg book-cover ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.log(`Image error loading: ${coverUrl}`);
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
        />
      )}
    </div>
  );

  return (
    <div className={`relative w-full h-full`}>
      {isbn ? (
        <Link to={`/book/${isbn}`} className="block h-full w-full">
          {coverElement}
        </Link>
      ) : (
        coverElement
      )}
    </div>
  );
};
