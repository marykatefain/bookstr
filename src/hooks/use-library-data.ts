
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/nostr/types";
import { fetchUserBooks, getCurrentUser, isLoggedIn, fetchUserReviews } from "@/lib/nostr";
import { fetchBookPosts } from "@/lib/nostr/fetch/socialFetch";
import { useQuery } from "@tanstack/react-query";

export const useLibraryData = () => {
  const [user, setUser] = useState(getCurrentUser());
  const { toast } = useToast();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  // Deduplicate books within the same list using ISBN as the unique identifier
  const deduplicateBooksWithinLists = (books: { tbr: Book[], reading: Book[], read: Book[] }) => {
    const uniqueTbr = deduplicateListByIsbn(books.tbr);
    const uniqueReading = deduplicateListByIsbn(books.reading);
    const uniqueRead = deduplicateListByIsbn(books.read);
    
    return {
      tbr: uniqueTbr,
      reading: uniqueReading,
      read: uniqueRead
    };
  };
  
  // Helper function to deduplicate a single list by ISBN
  const deduplicateListByIsbn = (books: Book[]): Book[] => {
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
  };
  
  // Deduplicate books across lists - prioritize finished > reading > tbr
  const deduplicateBookLists = (books: { tbr: Book[], reading: Book[], read: Book[] }) => {
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
  };
  
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });
  
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
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

  const getBookReadingStatus = (isbn: string | undefined): 'tbr' | 'reading' | 'finished' | null => {
    if (!isbn || !booksData) return null;
    
    // Prioritize "finished" status
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return 'finished';
    
    // Then "reading" status
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return 'reading';
    
    // Finally "tbr" status
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return 'tbr';
    
    return null;
  };

  const getBookByISBN = (isbn: string | undefined): Book | null => {
    if (!isbn || !booksData) return null;
    
    // Check lists in priority order: read > reading > tbr
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return readBook;
    
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return readingBook;
    
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return tbrBook;
    
    return null;
  };

  return {
    user,
    books: booksData,
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
