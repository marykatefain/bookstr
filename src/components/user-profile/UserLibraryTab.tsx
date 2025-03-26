
import React from "react";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";

interface UserLibraryTabProps {
  userBooks: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
}

export const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ userBooks }) => {
  // Log books with ratings for debugging
  const readBooksWithRatings = userBooks.read.filter(book => 
    book.readingStatus?.rating !== undefined
  );
  
  if (readBooksWithRatings.length > 0) {
    console.log(`Found ${readBooksWithRatings.length} read books with ratings:`, 
      readBooksWithRatings.map(b => ({ 
        title: b.title, 
        isbn: b.isbn, 
        rating: b.readingStatus?.rating 
      }))
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Reading Now</h2>
        {userBooks.reading.length === 0 ? (
          <p className="text-muted-foreground">No books currently being read.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {userBooks.reading.map(book => (
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
      
      <div>
        <h2 className="text-xl font-bold mb-4">Finished Reading</h2>
        {userBooks.read.length === 0 ? (
          <p className="text-muted-foreground">No finished books yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {userBooks.read.map(book => (
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
      
      <div>
        <h2 className="text-xl font-bold mb-4">Want to Read</h2>
        {userBooks.tbr.length === 0 ? (
          <p className="text-muted-foreground">No books on the TBR list yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {userBooks.tbr.map(book => (
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
    </div>
  );
};
