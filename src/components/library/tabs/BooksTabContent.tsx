
import React from "react";
import { BookSection } from "./BookSection";
import { Book } from "@/lib/nostr/types";
import { EmptyState } from "@/components/profile/EmptyState";
import { BookCard } from "@/components/BookCard";

interface BooksTabContentProps {
  books: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
  isLoading: boolean;
  filterType?: "all" | "tbr" | "reading" | "read";
  onUpdate?: () => void;
}

export const BooksTabContent: React.FC<BooksTabContentProps> = ({ 
  books, 
  isLoading,
  filterType = "all",
  onUpdate
}) => {
  // Debug logging to see books with ratings
  if (books) {
    const readBooksWithRatings = books.read.filter(b => b.readingStatus?.rating !== undefined);
    if (readBooksWithRatings.length > 0) {
      console.log(`BooksTabContent: Found ${readBooksWithRatings.length} read books with ratings:`, 
        readBooksWithRatings.map(b => ({
          title: b.title,
          isbn: b.isbn,
          rating: b.readingStatus?.rating
        }))
      );
    } else {
      console.log('BooksTabContent: No read books have ratings');
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[300px]"></div>
        ))}
      </div>
    );
  }

  // If we're filtering for a specific book type, show only that section
  if (filterType === "reading") {
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">Currently Reading</h1>
        {books.reading.length === 0 ? (
          <EmptyState type="reading" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.reading.map((book) => (
              <BookCard key={book.id} book={book} size="medium" showRating={true} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (filterType === "tbr") {
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">To Be Read</h1>
        {books.tbr.length === 0 ? (
          <EmptyState type="want-to-read" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.tbr.map((book) => (
              <BookCard key={book.id} book={book} size="medium" showRating={true} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (filterType === "read") {
    // Add logging for read books
    console.log(`Rendering Read section with ${books.read.length} books`);
    
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">Read</h1>
        {books.read.length === 0 ? (
          <EmptyState type="read" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.read.map((book) => {
              console.log(`Book in Read section: ${book.title}, rating: ${book.readingStatus?.rating}`);
              return (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  size="medium" 
                  showRating={true}
                  onUpdate={onUpdate} 
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: show all sections
  return (
    <>
      <BookSection 
        title="Currently Reading" 
        books={books.reading} 
        emptyStateType="reading"
        onUpdate={onUpdate} 
      />
      <BookSection 
        title="To Be Read" 
        books={books.tbr} 
        emptyStateType="want-to-read"
        onUpdate={onUpdate} 
      />
      <BookSection 
        title="Read" 
        books={books.read} 
        emptyStateType="read"
        onUpdate={onUpdate} 
      />
    </>
  );
};
