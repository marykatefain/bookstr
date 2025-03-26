
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
  console.log(`Rendering ${title} section with ${books.length} books`);

  // Log books with ratings for debugging
  const booksWithRatings = books.filter(book => book.readingStatus?.rating !== undefined);
  if (booksWithRatings.length > 0) {
    console.log(`Found ${booksWithRatings.length} books with ratings in ${title} section:`, booksWithRatings.map(b => ({
      title: b.title || "Unknown Title",
      isbn: b.isbn,
      rating: b.readingStatus?.rating
    })));
  }
  
  // Filter out books that don't have minimum required data
  const validBooks = books.filter(book => book.isbn);
  
  // Log invalid books for debugging
  const invalidBooks = books.filter(book => !book.isbn);
  if (invalidBooks.length > 0) {
    console.warn(`Found ${invalidBooks.length} invalid books in ${title} section without ISBN`);
  }
  
  const incompleteBooks = validBooks.filter(book => !book.title || !book.author);
  if (incompleteBooks.length > 0) {
    console.warn(`Found ${incompleteBooks.length} books with missing title/author in ${title} section:`, 
      incompleteBooks.map(b => ({ isbn: b.isbn, hasTitle: !!b.title, hasAuthor: !!b.author }))
    );
  }
  
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
