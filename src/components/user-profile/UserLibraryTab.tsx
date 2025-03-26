
import React from "react";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";
import { useQuery } from "@tanstack/react-query";
import { enhanceBooksWithDetails } from "@/lib/nostr/fetch/book/fetchDetails";

interface UserLibraryTabProps {
  userBooks: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
}

export const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ userBooks }) => {
  // Use react-query to enhance books with details
  const { data: enhancedUserBooks, isLoading } = useQuery({
    queryKey: ['enhanced-user-books', 
      userBooks.tbr.map(b => b.isbn).join(','),
      userBooks.reading.map(b => b.isbn).join(','),
      userBooks.read.map(b => b.isbn).join(',')
    ],
    queryFn: async () => {
      // Collect all ISBNs
      const allIsbns = [
        ...userBooks.tbr.map(b => b.isbn),
        ...userBooks.reading.map(b => b.isbn),
        ...userBooks.read.map(b => b.isbn)
      ].filter(Boolean) as string[];
      
      // Enhanced books - process each category separately to maintain structure
      const enhancedTbr = await enhanceBooksWithDetails(
        userBooks.tbr, 
        userBooks.tbr.map(b => b.isbn).filter(Boolean) as string[]
      );
      
      const enhancedReading = await enhanceBooksWithDetails(
        userBooks.reading,
        userBooks.reading.map(b => b.isbn).filter(Boolean) as string[]
      );
      
      const enhancedRead = await enhanceBooksWithDetails(
        userBooks.read,
        userBooks.read.map(b => b.isbn).filter(Boolean) as string[]
      );

      return {
        tbr: enhancedTbr,
        reading: enhancedReading,
        read: enhancedRead
      };
    },
    enabled: userBooks.tbr.length > 0 || userBooks.reading.length > 0 || userBooks.read.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false // Prevent unnecessary refetches
  });

  // Use enhanced books if available, otherwise fall back to original userBooks
  const displayBooks = enhancedUserBooks || userBooks;
  
  // Helper to render book section
  const renderBookSection = (title: string, books: Book[], emptyMessage: string) => (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {books.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {books.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              size="small"
              showDescription={false}
              showRating={true}
              onUpdate={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="space-y-8">
      {renderBookSection("Reading Now", displayBooks.reading, "No books currently being read.")}
      {renderBookSection("Finished Reading", displayBooks.read, "No finished books yet.")}
      {renderBookSection("Want to Read", displayBooks.tbr, "No books on the TBR list yet.")}
    </div>
  );
};
