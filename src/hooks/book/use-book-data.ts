
import { useState, useEffect, useCallback } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useLibraryData } from "@/hooks/use-library-data";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();
  const { getBookReadingStatus, books, getBookByISBN } = useLibraryData();

  // Get book from library with optimized memoization
  const libraryBook = useCallback(() => {
    if (!isbn) return null;
    return getBookByISBN(isbn);
  }, [isbn, getBookByISBN]);

  // Optimized query using a single fetching strategy with fallbacks
  const { 
    data: book = null, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      
      // First check if the book is in the user's library with complete data
      const userBook = libraryBook();
      
      if (userBook && isBookDataComplete(userBook)) {
        return userBook;
      }
      
      try {
        // Fetch book data from Nostr network
        const nostrResult = await fetchBookByISBN(isbn);
        
        // If we get complete data from Nostr, use it
        if (nostrResult && isBookDataComplete(nostrResult)) {
          // If we have a user book, merge the complete Nostr data with user's reading status
          if (userBook) {
            return {
              ...nostrResult,
              readingStatus: userBook.readingStatus
            };
          }
          return nostrResult;
        }
        
        // If we have partial data from both sources, merge them
        if (userBook && nostrResult) {
          return mergeBookData(userBook, nostrResult);
        }
        
        // If we only have partial data from one source, use it
        if (userBook) {
          return ensureMinimalBookData(userBook);
        }
        
        if (nostrResult) {
          return ensureMinimalBookData(nostrResult);
        }
        
        // If we have no data at all, return a minimal book object
        return {
          id: `isbn:${isbn}`,
          isbn: isbn,
          title: "Unknown Title",
          author: "Unknown Author",
          coverUrl: ""
        };
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details. Please try again later.",
          variant: "destructive"
        });
        
        // Return user's book data if available, otherwise minimal object
        return userBook ? ensureMinimalBookData(userBook) : {
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
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2, // Reduced retries to improve performance while still handling issues
    refetchOnWindowFocus: false,
  });

  // Get the reading status from the user's library
  const readingStatus = getBookReadingStatus(isbn);

  // Find the book in user's library to get its rating - optimized to check only once
  const findBookWithRating = useCallback(() => {
    if (!isbn || !books) return null;
    
    // First check the book we already have from getBookByISBN
    const bookFromLibrary = getBookByISBN(isbn);
    if (bookFromLibrary?.readingStatus?.rating !== undefined) {
      return bookFromLibrary;
    }
    
    return null;
  }, [isbn, books, getBookByISBN]);

  // Get user's rating from their library if available
  const bookWithRating = findBookWithRating();
  const userRating = bookWithRating?.readingStatus?.rating;

  // Update the book object with the reading status and rating - optimized to reduce object creation
  const enrichedBook = book ? {
    ...book,
    readingStatus: readingStatus ? {
      status: readingStatus,
      dateAdded: Date.now(),
      rating: userRating !== undefined ? userRating : book.readingStatus?.rating
    } : book.readingStatus
  } : null;

  // Reduce unnecessary refetches
  useEffect(() => {
    if (!isLoading && isbn && book && !isBookDataComplete(book)) {
      console.log(`Book data for ISBN ${isbn} is incomplete, triggering a refetch`);
      refetch();
    }
  }, [isbn, isLoading, book, refetch]);

  // Set read status when book data is available
  useEffect(() => {
    if (enrichedBook) {
      setIsRead(enrichedBook.readingStatus?.status === 'finished');
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

// Helper function to check if book data is complete
function isBookDataComplete(book: any): boolean {
  return book && 
         book.title && 
         book.author && 
         book.title !== 'Unknown Title' && 
         book.author !== 'Unknown Author';
}

// Helper function to ensure book has at least minimal data
function ensureMinimalBookData(book: any): any {
  return {
    ...book,
    title: book.title || "Unknown Title",
    author: book.author || "Unknown Author",
    coverUrl: book.coverUrl || ""
  };
}

// Helper function to merge book data from different sources
function mergeBookData(userBook: any, apiBook: any): any {
  const bestTitle = (apiBook.title && apiBook.title !== 'Unknown Title') 
    ? apiBook.title 
    : (userBook.title && userBook.title !== 'Unknown Title') 
      ? userBook.title 
      : 'Unknown Title';
  
  const bestAuthor = (apiBook.author && apiBook.author !== 'Unknown Author') 
    ? apiBook.author 
    : (userBook.author && userBook.author !== 'Unknown Author') 
      ? userBook.author 
      : 'Unknown Author';
  
  return {
    ...userBook,
    title: bestTitle,
    author: bestAuthor,
    coverUrl: apiBook.coverUrl || userBook.coverUrl || '',
    description: apiBook.description || userBook.description || '',
    categories: apiBook.categories || userBook.categories || [],
    pubDate: apiBook.pubDate || userBook.pubDate || '',
    pageCount: apiBook.pageCount || userBook.pageCount || 0,
    // Preserve user's reading status
    readingStatus: userBook.readingStatus
  };
}
