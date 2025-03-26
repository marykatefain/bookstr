
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
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[250px]"></div>
        ))}
      </div>
    );
  }

  // Render a specific book section based on filter type
  if (filterType !== "all") {
    const sectionConfig = {
      reading: {
        title: "Currently Reading",
        books: books.reading,
        emptyType: "reading"
      },
      tbr: {
        title: "To Be Read",
        books: books.tbr,
        emptyType: "want-to-read"
      },
      read: {
        title: "Read",
        books: books.read,
        emptyType: "read"
      }
    }[filterType];
    
    return (
      <div className="py-4">
        <h1 className="text-3xl font-serif font-semibold mb-6">{sectionConfig.title}</h1>
        {sectionConfig.books.length === 0 ? (
          <EmptyState type={sectionConfig.emptyType} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {sectionConfig.books.map((book) => (
              <BookCard key={book.id} book={book} size="medium" onUpdate={onUpdate} />
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
