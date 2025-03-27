import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/nostr/types";
import { fetchUserBooks, getCurrentUser, isLoggedIn, fetchUserReviews } from "@/lib/nostr";
import { fetchBookPostsByISBN } from "@/lib/nostr/fetch/socialFetch";
import { useQuery } from "@tanstack/react-query";
import { convertRawRatingToDisplayRating } from "@/lib/utils/ratings";

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
        
        const deduplicatedWithinLists = deduplicateBooksWithinLists(userBooks);
        
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
  
  const deduplicateListByIsbn = (books: Book[]): Book[] => {
    const uniqueBooks = new Map<string, Book>();
    
    books.forEach(book => {
      if (!book.isbn) return;
      
      const existingBook = uniqueBooks.get(book.isbn);
      
      if (!existingBook || 
          (book.readingStatus?.dateAdded && existingBook.readingStatus?.dateAdded && 
           book.readingStatus.dateAdded > existingBook.readingStatus.dateAdded)) {
        uniqueBooks.set(book.isbn, book);
      }
    });
    
    return Array.from(uniqueBooks.values());
  };
  
  const deduplicateBookLists = (books: { tbr: Book[], reading: Book[], read: Book[] }) => {
    const readIsbns = new Set(books.read.map(book => book.isbn));
    const readingIsbns = new Set(books.reading.map(book => book.isbn));
    
    const dedupedReading = books.reading.filter(book => {
      return book.isbn && !readIsbns.has(book.isbn);
    });
    
    const updatedReadingIsbns = new Set(dedupedReading.map(book => book.isbn));
    
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
    if (reviews.length > 0 && booksData) {
      console.log("Adding ratings to books from reviews");
      
      const ratingsMap = new Map<string, number>();
      reviews.forEach(review => {
        if (review.bookIsbn && review.rating !== undefined) {
          const displayRating = convertRawRatingToDisplayRating(review.rating);
          ratingsMap.set(review.bookIsbn, displayRating);
        }
      });
      
      console.log(`Found ${ratingsMap.size} ratings to apply to books`);
      
      const applyRatingsToBooks = (bookList: Book[]): Book[] => {
        return bookList.map(book => {
          if (book.isbn && ratingsMap.has(book.isbn)) {
            console.log(`Applying rating ${ratingsMap.get(book.isbn)} to book ${book.title} (${book.isbn})`);
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
      
      const updatedReadBooks = applyRatingsToBooks(booksData.read);
      const updatedReadingBooks = applyRatingsToBooks(booksData.reading);
      const updatedTbrBooks = applyRatingsToBooks(booksData.tbr);
      
      booksData.read = updatedReadBooks;
      booksData.reading = updatedReadingBooks;
      booksData.tbr = updatedTbrBooks;
    }
  }, [reviews, booksData]);
  
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
        const userPosts = await fetchBookPostsByISBN(user.pubkey);
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
    
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return 'finished';
    
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return 'reading';
    
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return 'tbr';
    
    return null;
  };

  const getBookByISBN = (isbn: string | undefined): Book | null => {
    if (!isbn || !booksData) return null;
    
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
