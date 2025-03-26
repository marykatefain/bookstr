
import React, { useEffect, useMemo } from "react";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/nostr/types";
import { enhanceBooksWithDetails } from "@/lib/nostr/fetch/book/fetchDetails";
import { useQuery } from "@tanstack/react-query";

interface UserLibraryTabProps {
  userBooks: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
}

export const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ userBooks }) => {
  // Create a single concat key for efficient cache invalidation
  const booksCacheKey = useMemo(() => {
    return [
      'enhanced-user-books', 
      userBooks.tbr.map(b => b.isbn).filter(Boolean).join(','),
      userBooks.reading.map(b => b.isbn).filter(Boolean).join(','),
      userBooks.read.map(b => b.isbn).filter(Boolean).join(',')
    ];
  }, [userBooks.tbr, userBooks.reading, userBooks.read]);
  
  // Use react-query to enhance books with details
  const { data: enhancedUserBooks, isLoading } = useQuery({
    queryKey: booksCacheKey,
    queryFn: async () => {
      // Collect all ISBNs
      const allIsbns = [
        ...userBooks.tbr.map(b => b.isbn),
        ...userBooks.reading.map(b => b.isbn),
        ...userBooks.read.map(b => b.isbn)
      ].filter(Boolean) as string[];

      if (allIsbns.length === 0) {
        return userBooks; // Return original data if no ISBNs to enhance
      }
      
      console.log(`Starting enhancement process for ${allIsbns.length} books`);
      
      // Enhanced books - passing in both books and their ISBNs to get details
      // Processing each category separately to maintain structure
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

      // Debug: Log the results to verify data is complete
      console.log(`Enhanced TBR books (${enhancedTbr.length}):`, 
        enhancedTbr.slice(0, 2).map(b => ({ 
          isbn: b.isbn, 
          title: b.title, 
          author: b.author,
          hasRating: b.readingStatus?.rating !== undefined
        }))
      );
      
      if (enhancedRead.length > 0) {
        console.log(`Enhanced Read books (sample of ${Math.min(2, enhancedRead.length)}):`,
          enhancedRead.slice(0, 2).map(b => ({ 
            isbn: b.isbn, 
            title: b.title, 
            author: b.author,
            hasRating: b.readingStatus?.rating !== undefined
          }))
        );
      }

      return {
        tbr: enhancedTbr,
        reading: enhancedReading,
        read: enhancedRead
      };
    },
    enabled: userBooks.tbr.length > 0 || userBooks.reading.length > 0 || userBooks.read.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    keepPreviousData: true, // Show previous data while loading new data
  });

  // Use enhanced books if available, otherwise fall back to original userBooks
  const displayBooks = enhancedUserBooks || userBooks;
  
  // Only log book information in development, not in production
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && enhancedUserBooks) {
      // Log counts only
      console.log('Library counts:', {
        reading: enhancedUserBooks.reading.length,
        read: enhancedUserBooks.read.length,
        tbr: enhancedUserBooks.tbr.length
      });
      
      // Only log detailed ratings information if needed for debugging
      if (enhancedUserBooks.read.some(book => book.readingStatus?.rating !== undefined)) {
        console.log(`Found books with ratings in Read section: ${
          enhancedUserBooks.read.filter(b => b.readingStatus?.rating !== undefined).length
        }`);
      }
    }
  }, [enhancedUserBooks]);
  
  // Memoize book sections to prevent unnecessary re-renders
  const ReadingSection = useMemo(() => (
    <div>
      <h2 className="text-xl font-bold mb-4">Reading Now</h2>
      {displayBooks.reading.length === 0 ? (
        <p className="text-muted-foreground">No books currently being read.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {displayBooks.reading.map(book => (
            <BookCard 
              key={book.id || `reading-${book.isbn}`} 
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
  ), [displayBooks.reading]);

  const ReadSection = useMemo(() => (
    <div>
      <h2 className="text-xl font-bold mb-4">Finished Reading</h2>
      {displayBooks.read.length === 0 ? (
        <p className="text-muted-foreground">No finished books yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {displayBooks.read.map(book => (
            <BookCard 
              key={book.id || `read-${book.isbn}`} 
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
  ), [displayBooks.read]);

  const TbrSection = useMemo(() => (
    <div>
      <h2 className="text-xl font-bold mb-4">Want to Read</h2>
      {displayBooks.tbr.length === 0 ? (
        <p className="text-muted-foreground">No books on the TBR list yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {displayBooks.tbr.map(book => (
            <BookCard 
              key={book.id || `tbr-${book.isbn}`} 
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
  ), [displayBooks.tbr]);
  
  return (
    <div className="space-y-8">
      {ReadingSection}
      {ReadSection}
      {TbrSection}
    </div>
  );
};
