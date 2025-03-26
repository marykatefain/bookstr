
import React, { useEffect } from "react";
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

      console.log(`Starting enhancement process for ${allIsbns.length} books`);
      
      // Log the original books to verify what we're starting with
      console.log('Original TBR books:', userBooks.tbr.map(b => ({
        isbn: b.isbn,
        title: b.title || 'No Title',
        author: b.author || 'No Author',
        hasRating: b.readingStatus?.rating !== undefined
      })));

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
        enhancedTbr.map(b => ({ 
          isbn: b.isbn, 
          title: b.title, 
          author: b.author,
          hasTitle: b.title !== 'Unknown Title',
          hasAuthor: b.author !== 'Unknown Author',
          hasRating: b.readingStatus?.rating !== undefined
        }))
      );
      
      console.log(`Enhanced Reading books (${enhancedReading.length}):`,
        enhancedReading.map(b => ({ 
          isbn: b.isbn, 
          title: b.title, 
          author: b.author,
          hasTitle: b.title !== 'Unknown Title',
          hasAuthor: b.author !== 'Unknown Author',
          hasRating: b.readingStatus?.rating !== undefined
        }))
      );
      
      console.log(`Enhanced Read books (${enhancedRead.length}):`,
        enhancedRead.map(b => ({ 
          isbn: b.isbn, 
          title: b.title, 
          author: b.author,
          hasTitle: b.title !== 'Unknown Title',
          hasAuthor: b.author !== 'Unknown Author',
          hasRating: b.readingStatus?.rating !== undefined
        }))
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
  
  // Log books with titles and authors for verification
  useEffect(() => {
    if (enhancedUserBooks) {
      console.log('Rendering Currently Reading section with', enhancedUserBooks.reading.length, 'books');
      console.log('Reading books with titles:', enhancedUserBooks.reading.map(book => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        hasTitle: book.title !== 'Unknown Title',
        hasAuthor: book.author !== 'Unknown Author'
      })));
      
      console.log('Rendering To Be Read section with', enhancedUserBooks.tbr.length, 'books');
      console.log('TBR books with titles:', enhancedUserBooks.tbr.map(book => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        hasTitle: book.title !== 'Unknown Title',
        hasAuthor: book.author !== 'Unknown Author'
      })));
      
      const tbrBooksWithRatings = enhancedUserBooks.tbr.filter(book => 
        book.readingStatus?.rating !== undefined
      );
      
      if (tbrBooksWithRatings.length > 0) {
        console.log(`Found ${tbrBooksWithRatings.length} books with ratings in To Be Read section:`, 
          tbrBooksWithRatings.map(b => ({ 
            title: b.title, 
            isbn: b.isbn, 
            rating: b.readingStatus?.rating 
          }))
        );
      }
      
      console.log('Rendering Read section with', enhancedUserBooks.read.length, 'books');
      console.log('Read books with titles:', enhancedUserBooks.read.map(book => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        hasTitle: book.title !== 'Unknown Title',
        hasAuthor: book.author !== 'Unknown Author'
      })));
      
      const readBooksWithRatings = enhancedUserBooks.read.filter(book => 
        book.readingStatus?.rating !== undefined
      );
      
      if (readBooksWithRatings.length > 0) {
        console.log(`Found ${readBooksWithRatings.length} books with ratings in Read section:`, 
          readBooksWithRatings.map(b => ({ 
            title: b.title, 
            isbn: b.isbn, 
            rating: b.readingStatus?.rating 
          }))
        );
      }
    }
  }, [enhancedUserBooks]);
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Reading Now</h2>
        {displayBooks.reading.length === 0 ? (
          <p className="text-muted-foreground">No books currently being read.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {displayBooks.reading.map(book => (
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
        {displayBooks.read.length === 0 ? (
          <p className="text-muted-foreground">No finished books yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {displayBooks.read.map(book => (
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
        {displayBooks.tbr.length === 0 ? (
          <p className="text-muted-foreground">No books on the TBR list yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {displayBooks.tbr.map(book => (
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
