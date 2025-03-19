
import React, { useEffect, useState } from "react";
import { Book } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookCard } from "@/components/BookCard";
import { Book as BookType } from "@/lib/nostr";

interface TrendingSidebarProps {
  books: BookType[];
  loading: boolean;
  refreshBooks: () => void;
}

export function TrendingSidebar({ books, loading, refreshBooks }: TrendingSidebarProps) {
  const [visibleBooks, setVisibleBooks] = useState<BookType[]>([]);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
  // Initialize with the first set of books immediately
  useEffect(() => {
    if (books.length > 0) {
      // Show initial books (up to 5) before container measurement
      const initialCount = Math.min(books.length, 5);
      setVisibleBooks(books.slice(0, initialCount));
    }
  }, [books]);
  
  // Calculate how many books can fit in the container without scrolling
  useEffect(() => {
    if (!containerRef || books.length === 0) return;
    
    const calculateVisibleBooks = () => {
      const containerHeight = containerRef.clientHeight;
      // Approximate height of each book card + margin
      const bookCardHeight = 100; // Height of small BookCard + margin
      const maxBooks = Math.floor(containerHeight / bookCardHeight);
      // Limit to available books
      const booksToShow = Math.min(maxBooks, books.length);
      
      if (booksToShow > 0) {
        setVisibleBooks(books.slice(0, booksToShow));
      }
    };
    
    calculateVisibleBooks();
    
    // Recalculate on resize
    const handleResize = () => calculateVisibleBooks();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef, books]);
  
  return (
    <Card className="bg-bookverse-paper shadow sticky top-8 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center">
          <Book className="mr-2 h-5 w-5 text-bookverse-accent" />
          Trending Books
        </CardTitle>
      </CardHeader>
      <CardContent 
        className="space-y-4 flex-grow"
        ref={setContainerRef}
      >
        {visibleBooks.length > 0 ? (
          visibleBooks.map((book) => (
            <BookCard 
              key={book.id} 
              book={book}
              showDescription={false}
              size="small"
              onUpdate={() => refreshBooks()}
            />
          ))
        ) : (
          books.slice(0, 5).map((book) => (
            <BookCard 
              key={book.id} 
              book={book}
              showDescription={false}
              size="small"
              onUpdate={() => refreshBooks()}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
