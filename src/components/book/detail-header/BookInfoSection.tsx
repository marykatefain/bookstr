
import React from "react";
import { Book } from "@/lib/nostr/types";
import { BookOpen, Star, Calendar, Clock } from "lucide-react";
import { BookRating } from "@/components/book/BookRating";
import { Rating } from "@/lib/utils/Rating";

interface BookInfoSectionProps {
  book: Book;
  avgRating: Rating;
  ratingsCount: number;
}

export const BookInfoSection: React.FC<BookInfoSectionProps> = ({ 
  book, 
  avgRating, 
  ratingsCount 
}) => {
  const readingStatus = book.readingStatus?.status;
  let mappedReadingStatus: 'tbr' | 'reading' | 'finished' | null = null;
  
  if (readingStatus === 'tbr') {
    mappedReadingStatus = 'tbr';
  } else if (readingStatus === 'reading') {
    mappedReadingStatus = 'reading';
  } else if (readingStatus === 'finished') {
    mappedReadingStatus = 'finished';
  }

  return (
    <div className="md:w-2/3">
      <h1 className="text-3xl font-bold text-bookverse-ink">{book.title}</h1>
      <h2 className="text-xl text-muted-foreground mt-2">{book.author}</h2>
      
      <div className="flex flex-wrap gap-4 mt-4">
        {avgRating && avgRating.fraction > 0 && (
          <div className="flex items-center gap-1">
            <BookRating 
              rating={avgRating} 
              readingStatus={mappedReadingStatus}
            />
            <span className="ml-1 text-sm">({ratingsCount})</span>
          </div>
        )}
        
        {book.pageCount && book.pageCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{book.pageCount} pages</span>
          </div>
        )}
        
        {book.pubDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Published {book.pubDate}</span>
          </div>
        )}
        
        {book.isbn && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>ISBN: {book.isbn}</span>
          </div>
        )}
      </div>
      
      {book.categories && book.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {book.categories.map((category, index) => (
            <span 
              key={index} 
              className="bg-bookverse-paper text-bookverse-ink px-2 py-1 rounded-full text-xs"
            >
              {category}
            </span>
          ))}
        </div>
      )}
      
      {book.description && (
        <div className="mt-6">
          <h3 className="text-lg font-medium">Description</h3>
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
            {book.description}
          </p>
        </div>
      )}
    </div>
  );
};
