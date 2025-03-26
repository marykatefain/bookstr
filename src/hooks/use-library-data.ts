
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/nostr/types";
import { fetchUserBooks, getCurrentUser, isLoggedIn, fetchUserReviews } from "@/lib/nostr";
import { fetchBookPosts } from "@/lib/nostr/fetch/socialFetch";
import { useQuery } from "@tanstack/react-query";
import { convertRawRatingToDisplayRating } from "@/lib/utils/ratings";

export const useLibraryData = () => {
  const [user, setUser] = useState(getCurrentUser());
  const { toast } = useToast();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  
  // Use optimized query with stale time and caching
  const { 
    data: booksData = { tbr: [], reading: [], read: [] },
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks
  } = useQuery({
    queryKey: ['userBooks', user?.pubkey],
    queryFn: async () => {
      if (!isLoggedIn() || !user?.pubkey) {
        return { tbr: [], reading: [], read: [] };
      }

      try {
        console.log("Fetching user books data for library");
        const userBooks = await fetchUserBooks(user.pubkey);
        console.log("User books data fetched:", userBooks);
        
        // First deduplicate books within the same lists
        const deduplicatedWithinLists = deduplicateBooksWithinLists(userBooks);
        
        // Then deduplicate books across lists
        return deduplicateBookLists(deduplicatedWithinLists);        
      } catch (error) {
        console.error("Error fetching user books:", error);
        throw error;
      }
    },
    enabled: !!user?.pubkey && isLoggedIn(),
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    refetchOnWindowFocus: false, // Only refetch manually or on mount
    refetchOnMount: true,
    placeholderData: { tbr: [], reading: [], read: [] } // Placeholder data while loading
  });
  
  // Memoized function to deduplicate books within the same list
  const deduplicateBooksWithinLists = useCallback((books: { tbr: Book[], reading: Book[], read: Book[] }) => {
    const uniqueTbr = deduplicateListByIsbn(books.tbr);
    const uniqueReading = deduplicateListByIsbn(books.reading);
    const uniqueRead = deduplicateListByIsbn(books.read);
    
    return {
      tbr: uniqueTbr,
      reading: uniqueReading,
      read: uniqueRead
    };
  }, []);
  
  // Helper function to deduplicate a single list by ISBN
  const deduplicateListByIsbn = useCallback((books: Book[]): Book[] => {
    const uniqueBooks = new Map<string, Book>();
    
    // Process books, keeping only the most recent entry for each ISBN
    books.forEach(book => {
      if (!book.isbn) return; // Skip books without ISBN
      
      const existingBook = uniqueBooks.get(book.isbn);
      
      // If book doesn't exist in map or current book is newer, add/replace it
      if (!existingBook || 
          (book.readingStatus?.dateAdded && existingBook.readingStatus?.dateAdded && 
           book.readingStatus.dateAdded > existingBook.readingStatus.dateAdded)) {
        uniqueBooks.set(book.isbn, book);
      }
    });
    
    return Array.from(uniqueBooks.values());
  }, []);
  
  // Memoized function to deduplicate books across lists
  const deduplicateBookLists = useCallback((books: { tbr: Book[], reading: Book[], read: Book[] }) => {
    // Create sets of ISBNs for each list to track what's already been processed
    const readIsbns = new Set(books.read.map(book => book.isbn));
    const readingIsbns = new Set(books.reading.map(book => book.isbn));
    
    // Filter reading list to remove books that are already in read list
    const dedupedReading = books.reading.filter(book => {
      return book.isbn && !readIsbns.has(book.isbn);
    });
    
    // Update the reading ISBNs set after deduplication
    const updatedReadingIsbns = new Set(dedupedReading.map(book => book.isbn));
    
    // Filter tbr list to remove books that are in read or deduped reading lists
    const dedupedTbr = books.tbr.filter(book => {
      return book.isbn && !readIsbns.has(book.isbn) && !updatedReadingIsbns.has(book.isbn);
    });
    
    return {
      read: books.read,
      reading: dedupedReading,
      tbr: dedupedTbr
    };
  }, []);
  
  // Optimize reviews query with proper caching strategy
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    error: reviewsError
  } = useQuery({
    queryKey: ['userReviews', user?.pubkey],
    queryFn: async () => {
      if (!isLoggedIn() || !user?.pubkey) {
        return [];
      }
      
      try {
        console.log("Fetching reviews for user:", user.pubkey);
        const userReviews = await fetchUserReviews(user.pubkey);
        console.log("Fetched reviews:", userReviews);
        return userReviews;
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        throw error;
      }
    },
    enabled: !!user?.pubkey && isLoggedIn(),
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    refetchOnWindowFocus: false,
    placeholderData: [] // Placeholder data while loading
  });
  
  // Create memoized ratings map from reviews for efficient lookup
  const ratingsMap = useMemo(() => {
    if (!reviews.length) return new Map<string, number>();
    
    const map = new Map<string, number>();
    reviews.forEach(review => {
      if (review.bookIsbn && review.rating !== undefined) {
        const displayRating = convertRawRatingToDisplayRating(review.rating);
        map.set(review.bookIsbn, displayRating);
      }
    });
    
    console.log(`Created ratings map with ${map.size} entries`);
    return map;
  }, [reviews]);
  
  // Apply ratings to books in a memoized way to avoid unnecessary re-computations
  const booksWithRatings = useMemo(() => {
    if (!booksData || ratingsMap.size === 0) return booksData;
    
    console.log(`Applying ${ratingsMap.size} ratings to books`);
    
    // Apply ratings to books
    const applyRatingsToBooks = (bookList: Book[]): Book[] => {
      return bookList.map(book => {
        if (book.isbn && ratingsMap.has(book.isbn)) {
          return {
            ...book,
            readingStatus: {
              ...book.readingStatus!,
              rating: ratingsMap.get(book.isbn)
            }
          };
        }
        return book;
      });
    };
    
    // Apply ratings to all book categories
    return {
      read: applyRatingsToBooks(booksData.read),
      reading: applyRatingsToBooks(booksData.reading),
      tbr: applyRatingsToBooks(booksData.tbr)
    };
  }, [booksData, ratingsMap]);
  
  // Optimize posts query with better caching strategy
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError
  } = useQuery({
    queryKey: ['userPosts', user?.pubkey],
    queryFn: async () => {
      if (!isLoggedIn() || !user?.pubkey) {
        return [];
      }
      
      try {
        console.log("Fetching book posts for user:", user.pubkey);
        const userPosts = await fetchBookPosts(user.pubkey, false);
        console.log("Fetched posts:", userPosts);
        return userPosts;
      } catch (error) {
        console.error("Error fetching user posts:", error);
        throw error;
      }
    },
    enabled: !!user?.pubkey && isLoggedIn(),
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    refetchOnWindowFocus: false,
    placeholderData: [] // Placeholder data while loading
  });
  
  useEffect(() => {
    if (booksError) {
      toast({
        title: "Error",
        description: "Failed to load your books",
        variant: "destructive",
      });
    }
    
    if (postsError) {
      toast({
        title: "Error",
        description: "Failed to load your posts",
        variant: "destructive",
      });
    }
    
    if (reviewsError) {
      toast({
        title: "Error",
        description: "Failed to load your reviews",
        variant: "destructive",
      });
    }
  }, [booksError, postsError, reviewsError, toast]);

  // Memoized function to get book reading status by ISBN
  const getBookReadingStatus = useCallback((isbn: string | undefined): 'tbr' | 'reading' | 'finished' | null => {
    if (!isbn || !booksWithRatings) return null;
    
    // Prioritize "finished" status
    const readBook = booksWithRatings.read.find(book => book.isbn === isbn);
    if (readBook) return 'finished';
    
    // Then "reading" status
    const readingBook = booksWithRatings.reading.find(book => book.isbn === isbn);
    if (readingBook) return 'reading';
    
    // Finally "tbr" status
    const tbrBook = booksWithRatings.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return 'tbr';
    
    return null;
  }, [booksWithRatings]);

  // Memoized function to get book by ISBN across all categories
  const getBookByISBN = useCallback((isbn: string | undefined): Book | null => {
    if (!isbn || !booksWithRatings) return null;
    
    // Check lists in priority order: read > reading > tbr
    const readBook = booksWithRatings.read.find(book => book.isbn === isbn);
    if (readBook) return readBook;
    
    const readingBook = booksWithRatings.reading.find(book => book.isbn === isbn);
    if (readingBook) return readingBook;
    
    const tbrBook = booksWithRatings.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return tbrBook;
    
    return null;
  }, [booksWithRatings]);

  return {
    user,
    books: booksWithRatings,
    posts,
    reviews,
    booksLoading,
    postsLoading,
    reviewsLoading,
    isLoggedIn: isLoggedIn(),
    refetchBooks,
    getBookReadingStatus,
    getBookByISBN
  };
};
