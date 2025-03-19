
import React from "react";
import { BookSection } from "./BookSection";
import { Book } from "@/lib/nostr/types";
import { EmptyState } from "@/components/profile/EmptyState";

interface BooksTabContentProps {
  books: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
  isLoading: boolean;
  filterType?: "all" | "tbr" | "reading" | "read";
}

export const BooksTabContent: React.FC<BooksTabContentProps> = ({ 
  books, 
  isLoading,
  filterType = "all" 
}) => {
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
              <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (filterType === "tbr") {
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">Want to Read</h1>
        {books.tbr.length === 0 ? (
          <EmptyState type="want-to-read" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.tbr.map((book) => (
              <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (filterType === "read") {
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">Read</h1>
        {books.read.length === 0 ? (
          <EmptyState type="read" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.read.map((book) => (
              <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
            ))}
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
      />
      <BookSection 
        title="Want to Read" 
        books={books.tbr} 
        emptyStateType="want-to-read" 
      />
      <BookSection 
        title="Read" 
        books={books.read} 
        emptyStateType="read" 
      />
    </>
  );
};

// Import BookCard component at the top
import { BookCard } from "@/components/BookCard";
