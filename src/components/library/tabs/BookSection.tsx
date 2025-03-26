
import React from "react";
import { EmptyState } from "@/components/profile/EmptyState";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";

interface BookSectionProps {
  title: string;
  books: Book[];
  emptyStateType: string;
  onUpdate?: () => void;
}

export const BookSection: React.FC<BookSectionProps> = ({
  title,
  books,
  emptyStateType,
  onUpdate
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log(`BookSection "${title}" received ${books.length} books`);
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`Sample book in "${title}":`, {
        isbn: firstBook.isbn,
        title: firstBook.title,
        author: firstBook.author
      });
    }
  }, [books, title]);

  // Filter out books that don't have minimum required data
  const validBooks = books.filter(book => book && book.isbn);
  
  return (
    <section className="mb-12 py-0 my-[25px]">
      <h2 className="text-2xl font-serif font-semibold mb-4">{title}</h2>
      {validBooks.length === 0 ? (
        <EmptyState type={emptyStateType} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {validBooks.map(book => (
            <BookCard 
              key={`${book.id || book.isbn}`} 
              book={book} 
              size="medium" 
              showRating={true} 
              onUpdate={onUpdate} 
            />
          ))}
        </div>
      )}
    </section>
  );
};
