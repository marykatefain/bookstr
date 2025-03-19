
import React from "react";
import { EmptyState } from "@/components/profile/EmptyState";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";

interface BookSectionProps {
  title: string;
  books: Book[];
  emptyStateType: string;
}

export const BookSection: React.FC<BookSectionProps> = ({ title, books, emptyStateType }) => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-serif font-semibold mb-4">{title}</h2>
      {books.length === 0 ? (
        <EmptyState type={emptyStateType} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
          ))}
        </div>
      )}
    </section>
  );
};
