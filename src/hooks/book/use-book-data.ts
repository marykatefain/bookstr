
import { useState, useEffect, useCallback } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useLibraryData } from "@/hooks/use-library-data";
import { useQuery } from "@tanstack/react-query";
import { getCachedBookByISBN } from "@/lib/cache/libraryCache";
import { getBookByISBN } from "@/lib/openlibrary";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();
  const { getBookReadingStatus, books, getBookByISBN } = useLibraryData();

  // First try to get the book from the user's library which might have more data
  const libraryBook = useCallback(() => {
    if (!isbn) return null;
    return getBookByISBN(isbn);
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
      if (userBook && userBook.title && userBook.author) {
        console.log(`Using user's library book data for ISBN: ${isbn}`);
        return userBook;
      }
      
      // Then try to get from library cache
      const cachedBook = getCachedBookByISBN(isbn);
      if (cachedBook && cachedBook.title && cachedBook.author) {
        console.log(`Using cached book data for ISBN: ${isbn}`, cachedBook);
        return cachedBook;
      } else {
        console.log("Cached book data is missing or incomplete, fetching fresh data");
      }
      
      try {
        // First try with fetchBookByISBN from Nostr
        const nostrResult = await fetchBookByISBN(isbn);
        
        // If we get a complete result from Nostr, use it
        if (nostrResult && nostrResult.title && nostrResult.author) {
          console.log(`Book data loaded successfully from Nostr for ISBN: ${isbn}:`, nostrResult);
          return nostrResult;
        }
        
        // If Nostr data is incomplete, try fetching directly from OpenLibrary
        console.log(`Nostr data incomplete or missing for ISBN: ${isbn}, fetching directly from OpenLibrary`);
        const openLibraryResult = await getBookByISBN(isbn);
        
        if (!openLibraryResult || (!openLibraryResult.title && !openLibraryResult.author)) {
          console.error(`No complete data returned for ISBN: ${isbn} from any source`);
          throw new Error("Book details not found");
        }
        
        console.log(`Book data loaded successfully from OpenLibrary for ISBN: ${isbn}:`, openLibraryResult);
        return openLibraryResult;
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details. Please try again later.",
          variant: "destructive"
        });
        throw err;
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
    if (!isLoading && isbn && !book) {
      console.log(`No book data for ISBN ${isbn}, triggering a refetch`);
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
      console.log("Final enriched book data:", enrichedBook);
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
