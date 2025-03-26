import { useState, useEffect, useCallback } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useLibraryData } from "@/hooks/use-library-data";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();
  const { getBookReadingStatus, books, getBookByISBN } = useLibraryData();

  // First try to get the book from the user's library which might have more data
  const libraryBook = useCallback(() => {
    if (!isbn) return null;
    const book = getBookByISBN(isbn);
    
    if (book) {
      console.log(`Found book in user's library for ISBN ${isbn}:`, {
        hasTitle: !!book.title && book.title !== 'Unknown Title',
        hasAuthor: !!book.author && book.author !== 'Unknown Author',
        title: book.title,
        author: book.author
      });
    }
    
    return book;
  }, [isbn, getBookByISBN]);

  const { 
    data: book = null, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      console.log(`Fetching book details for ISBN: ${isbn}`);
      
      // First check if the book is in the user's library
      const userBook = libraryBook();
      
      // Only use user's book if it has complete data
      if (userBook && userBook.title && userBook.author && 
          userBook.title !== 'Unknown Title' && userBook.author !== 'Unknown Author') {
        console.log(`Using user's library book data for ISBN: ${isbn}`, userBook);
        return userBook;
      } else if (userBook) {
        console.log(`User's library book data for ISBN: ${isbn} is incomplete:`, {
          hasTitle: !!userBook.title && userBook.title !== 'Unknown Title',
          hasAuthor: !!userBook.author && userBook.author !== 'Unknown Author'
        });
      }
      
      try {
        // First try with fetchBookByISBN from Nostr
        const nostrResult = await fetchBookByISBN(isbn);
        
        // If we get a complete result from Nostr, use it
        if (nostrResult && nostrResult.title && nostrResult.author && 
            nostrResult.title !== 'Unknown Title' && nostrResult.author !== 'Unknown Author') {
          console.log(`Book data loaded successfully from Nostr for ISBN: ${isbn}:`, {
            title: nostrResult.title,
            author: nostrResult.author
          });
          return nostrResult;
        } else if (nostrResult) {
          console.log(`Nostr data incomplete for ISBN: ${isbn}:`, {
            hasTitle: !!nostrResult.title && nostrResult.title !== 'Unknown Title',
            hasAuthor: !!nostrResult.author && nostrResult.author !== 'Unknown Author'
          });
        }
        
        // If Nostr data is incomplete, try fetching directly from OpenLibrary
        console.log(`Fetching directly from OpenLibrary for ISBN: ${isbn}`);
        const openLibraryResult = await getBookByISBN(isbn);
        
        if (openLibraryResult && openLibraryResult.title && openLibraryResult.author) {
          console.log(`Book data loaded successfully from OpenLibrary for ISBN: ${isbn}:`, {
            title: openLibraryResult.title,
            author: openLibraryResult.author
          });
          
          // If we have an incomplete userBook, merge the OpenLibrary data with it
          if (userBook) {
            console.log(`Merging OpenLibrary data with user's library book for ISBN: ${isbn}`);
            return {
              ...userBook,
              title: openLibraryResult.title || userBook.title || 'Unknown Title',
              author: openLibraryResult.author || userBook.author || 'Unknown Author',
              coverUrl: userBook.coverUrl || openLibraryResult.coverUrl || '',
              description: userBook.description || openLibraryResult.description || ''
            };
          }
          
          // Otherwise return the OpenLibrary result
          return openLibraryResult;
        }
        
        if (!openLibraryResult) {
          console.error(`No data returned for ISBN: ${isbn} from any source`);
          // Return a minimal book object with the ISBN but placeholders for missing data
          return {
            id: `isbn:${isbn}`,
            isbn: isbn,
            title: "Unknown Title",
            author: "Unknown Author",
            coverUrl: ""
          };
        }
        
        // Ensure we have at least placeholder values for title and author
        const enrichedResult = {
          ...openLibraryResult,
          title: openLibraryResult.title || "Unknown Title",
          author: openLibraryResult.author || "Unknown Author"
        };
        
        console.log(`Book data loaded with placeholders for ISBN: ${isbn}:`, enrichedResult);
        return enrichedResult;
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details. Please try again later.",
          variant: "destructive"
        });
        // Return a minimal book object in case of errors
        return {
          id: `isbn:${isbn}`,
          isbn: isbn,
          title: "Unknown Title",
          author: "Unknown Author",
          coverUrl: ""
        };
      }
    },
    enabled: !!isbn,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (increased for better caching)
    retry: 3, // Increased retries to handle potential API issues
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // Get the reading status from the user's library
  const readingStatus = getBookReadingStatus(isbn);

  // Find the book in user's library to get its rating
  const findBookWithRating = useCallback(() => {
    if (!isbn || !books) return null;
    
    // Check each list for the book with matching ISBN
    const bookInTbr = books.tbr.find(b => b.isbn === isbn);
    if (bookInTbr?.readingStatus?.rating !== undefined) return bookInTbr;
    
    const bookInReading = books.reading.find(b => b.isbn === isbn);
    if (bookInReading?.readingStatus?.rating !== undefined) return bookInReading;
    
    const bookInRead = books.read.find(b => b.isbn === isbn);
    if (bookInRead?.readingStatus?.rating !== undefined) return bookInRead;
    
    return null;
  }, [isbn, books]);

  // Get user's rating from their library if available
  const bookWithRating = findBookWithRating();
  const userRating = bookWithRating?.readingStatus?.rating;

  // Update the book object with the reading status and rating
  const enrichedBook = book ? {
    ...book,
    readingStatus: readingStatus ? {
      status: readingStatus,
      dateAdded: Date.now(), // Add the required dateAdded property
      rating: userRating !== undefined ? userRating : book.readingStatus?.rating
    } : book.readingStatus
  } : null;

  // Force a refetch if we have an ISBN but no book details after loading
  useEffect(() => {
    if (!isLoading && isbn && (!book || book.title === 'Unknown Title' || book.author === 'Unknown Author')) {
      console.log(`Book data for ISBN ${isbn} is missing or incomplete, triggering a refetch`, book);
      refetch();
    }
  }, [isbn, isLoading, book, refetch]);

  // Set read status when book data is available
  useEffect(() => {
    if (enrichedBook) {
      setIsRead(enrichedBook.readingStatus?.status === 'finished');
    }
  }, [enrichedBook]);

  // Log the final enriched book for debugging
  useEffect(() => {
    if (enrichedBook) {
      console.log("Final enriched book data:", {
        isbn: enrichedBook.isbn,
        title: enrichedBook.title,
        author: enrichedBook.author,
        hasReadingStatus: !!enrichedBook.readingStatus,
        readingStatus: enrichedBook.readingStatus?.status,
        rating: enrichedBook.readingStatus?.rating
      });
    }
  }, [enrichedBook]);

  return {
    book: enrichedBook,
    loading: isLoading,
    isRead,
    setIsRead,
    error,
    refetch
  };
};
