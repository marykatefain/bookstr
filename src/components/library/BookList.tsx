
import React from "react";
import { Link } from "react-router-dom";
import { Book } from "@/lib/nostr/types";
import { BookCover } from "@/components/book/BookCover";
import { BookRating } from "@/components/book/BookRating";

interface BookListProps {
  books: Book[];
  onUpdate?: () => void;
}

export const BookList: React.FC<BookListProps> = ({ books, onUpdate }) => {
  if (books.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">No books in this section.</p>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <div key={book.id || book.isbn} className="flex border-b pb-4 last:border-0">
          <div className="w-14 h-20 flex-shrink-0 mr-4">
            <BookCover 
              isbn={book.isbn}
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
            />
          </div>
          <div className="flex-1">
            <Link to={`/book/${book.isbn}`} className="font-medium hover:text-bookverse-accent">
              {book.title || "Unknown Title"}
            </Link>
            <p className="text-sm text-muted-foreground">{book.author || "Unknown Author"}</p>
            {book.readingStatus?.rating && (
              <div className="mt-1">
                <BookRating rating={book.readingStatus.rating} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
