
import React from "react";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";

interface BookGridProps {
  books: Book[];
  onUpdate?: () => void;
}

export const BookGrid: React.FC<BookGridProps> = ({ books, onUpdate }) => {
  if (books.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">No books in this section.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book) => (
        <BookCard 
          key={book.id || book.isbn} 
          book={book} 
          size="medium" 
          onUpdate={onUpdate} 
        />
      ))}
    </div>
  );
};
