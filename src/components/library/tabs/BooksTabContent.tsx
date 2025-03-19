
import React from "react";
import { BookSection } from "./BookSection";
import { Book } from "@/lib/nostr/types";

interface BooksTabContentProps {
  books: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
  isLoading: boolean;
}

export const BooksTabContent: React.FC<BooksTabContentProps> = ({ books, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[300px]"></div>
        ))}
      </div>
    );
  }

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
