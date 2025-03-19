
import React from "react";
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
  return (
    <Card className="bg-bookverse-paper shadow sticky top-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center">
          <Book className="mr-2 h-5 w-5 text-bookverse-accent" />
          Trending Books
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {books.slice(0, 5).map((book) => (
          <BookCard 
            key={book.id} 
            book={book}
            showDescription={false}
            size="small"
            onUpdate={() => refreshBooks()}
          />
        ))}
      </CardContent>
    </Card>
  );
}
