import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book, Post, BookReview } from "@/lib/nostr/types";
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
        return userBooks;
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
    
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return 'tbr';
    
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return 'reading';
    
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return 'finished';
    
    return null;
  };

  const getBookByISBN = (isbn: string | undefined): Book | null => {
    if (!isbn || !booksData) return null;
    
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return tbrBook;
    
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return readingBook;
    
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return readBook;
    
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
