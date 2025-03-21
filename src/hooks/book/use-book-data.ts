
import { useState, useEffect } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useLibraryData } from "@/hooks/use-library-data";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();
  const { getBookReadingStatus, books, getBookByISBN } = useLibraryData();

  const { 
    data: book = null, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      console.log(`Fetching book details for ISBN: ${isbn}`);
      try {
        const result = await fetchBookByISBN(isbn);
        console.log(`Book data loaded successfully for ISBN: ${isbn}`);
        return result;
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: !!isbn,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });

  // Get the reading status from the user's library
  const readingStatus = getBookReadingStatus(isbn);

  // Find the book in user's library to get its rating
  const bookInLibrary = getBookByISBN(isbn);
  
  // Extract user's rating from their library if available
  let userRating: number | null = null;
  
  if (bookInLibrary?.readingStatus?.rating !== undefined) {
    const ratingValue = bookInLibrary.readingStatus.rating;
    console.log(`Processing rating for ${isbn}:`, ratingValue);
    
    // Handle different rating formats
    if (typeof ratingValue === 'number') {
      userRating = ratingValue;
      console.log(`Numeric rating found: ${userRating}`);
    } else if (typeof ratingValue === 'string') {
      const parsedValue = parseFloat(ratingValue);
      if (!isNaN(parsedValue)) {
        userRating = parsedValue;
        console.log(`String rating parsed: ${userRating}`);
      }
    } else if (ratingValue !== null && typeof ratingValue === 'object') {
      // Handle complex object format
      if ('value' in ratingValue && ratingValue.value !== undefined) {
        const valueField = ratingValue.value;
        if (typeof valueField === 'number') {
          userRating = valueField;
        } else if (typeof valueField === 'string') {
          const parsedValue = parseFloat(valueField);
          if (!isNaN(parsedValue)) {
            userRating = parsedValue;
          }
        }
        console.log(`Object rating extracted: ${userRating}`);
      }
    }
  }

  console.log(`Final rating value for ${isbn}:`, userRating);
  
  // Update the book object with the reading status and rating
  const enrichedBook = book ? {
    ...book,
    readingStatus: readingStatus ? {
      status: readingStatus,
      dateAdded: Date.now(), // Add the required dateAdded property
      rating: userRating !== null ? userRating : book.readingStatus?.rating
    } : book.readingStatus
  } : null;

  // Enhanced logging for rating visibility
  if (enrichedBook && enrichedBook.readingStatus?.rating !== undefined) {
    console.log(`Book ${enrichedBook.title} has rating:`, enrichedBook.readingStatus.rating);
  }

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
    setIsRead
  };
};
