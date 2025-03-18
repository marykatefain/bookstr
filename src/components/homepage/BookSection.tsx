
import React from "react";
import { Link } from "react-router-dom";
import { BookCard } from "@/components/BookCard";
import { Loader2 } from "lucide-react";
import { Book } from "@/lib/nostr/types";

interface BookSectionProps {
  title: string;
  books: Book[];
  loading: boolean;
  onUpdate: () => void;
}

export function BookSection({ title, books, loading, onUpdate }: BookSectionProps) {
  const renderLoadingCard = () => (
    <div className="overflow-hidden h-full book-card">
      <div className="p-0">
        <div className="relative aspect-[2/3] bg-gray-200 animate-pulse"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          <div className="flex items-center space-x-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="pt-2 flex space-x-2">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-bookverse-ink">{title}</h2>
            <Link to="/books" className="text-sm text-bookverse-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                {renderLoadingCard()}
                {renderLoadingCard()}
                {renderLoadingCard()}
              </>
            ) : (
              books.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book}
                  showDescription={true}
                  size="medium"
                  onUpdate={() => onUpdate()}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
