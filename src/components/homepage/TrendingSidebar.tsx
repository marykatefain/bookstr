
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
  
  // Initialize with some books immediately to avoid empty state
  useEffect(() => {
    // Show first 5 books initially before container measurement
    if (books.length > 0) {
      const initialBooks = Math.min(books.length, 5);
      setVisibleBooks(books.slice(0, initialBooks));
    }
  }, [books]);
  
  // Calculate how many books can fit in the container
  useEffect(() => {
    if (!containerRef || books.length === 0) return;
    
    const calculateVisibleBooks = () => {
      const containerHeight = containerRef.clientHeight;
      // Approximate height of each book card + margin
      const bookCardHeight = 100; // Height of small BookCard + margin
      const maxBooks = Math.floor(containerHeight / bookCardHeight);
      // Limit to available books, up to 10 maximum
      const booksToShow = Math.min(maxBooks, books.length, 10);
      setVisibleBooks(books.slice(0, booksToShow));
    };
    
    calculateVisibleBooks();
    
    // Recalculate on resize
    const handleResize = () => calculateVisibleBooks();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef, books]);
  
  return (
    <Card className="bg-bookverse-paper shadow sticky top-8 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center">
          <Book className="mr-2 h-5 w-5 text-bookverse-accent" />
          Trending Books
        </CardTitle>
      </CardHeader>
      <CardContent 
        className="space-y-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 10rem)' }}
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
