
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book, Post } from "@/lib/nostr/types";
import { fetchUserBooks, getCurrentUser, isLoggedIn } from "@/lib/nostr";
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
  
  // Handle errors with toast notifications
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
  }, [booksError, postsError, toast]);

  // Helper function to get a book's reading status by ISBN
  const getBookReadingStatus = (isbn: string | undefined): 'tbr' | 'reading' | 'finished' | null => {
    if (!isbn || !booksData) return null;
    
    // Check TBR list
    const tbrBook = booksData.tbr.find(book => book.isbn === isbn);
    if (tbrBook) return 'tbr';
    
    // Check reading list
    const readingBook = booksData.reading.find(book => book.isbn === isbn);
    if (readingBook) return 'reading';
    
    // Check read list
    const readBook = booksData.read.find(book => book.isbn === isbn);
    if (readBook) return 'finished';
    
    return null;
  };

  return {
    user,
    books: booksData,
    posts,
    booksLoading,
    postsLoading,
    isLoggedIn: isLoggedIn(),
    refetchBooks,
    getBookReadingStatus
  };
};
