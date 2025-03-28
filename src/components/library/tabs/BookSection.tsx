
import React from "react";
import { Book } from "@/lib/nostr/types";
import { EmptyState } from "@/components/profile/EmptyState";
import { BookCard } from "@/components/BookCard";

interface BookSectionProps {
  title: string;
  books: Book[];
  emptyStateType?: string;
  onUpdate?: () => void;
}

export const BookSection: React.FC<BookSectionProps> = ({ 
  title, 
  books, 
  emptyStateType,
  onUpdate
}) => {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-serif font-semibold mb-6">{title}</h2>
      {books.length === 0 ? (
        <EmptyState 
          type={emptyStateType} 
          actionText="Search for Books"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              size="medium" 
              onUpdate={onUpdate} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
