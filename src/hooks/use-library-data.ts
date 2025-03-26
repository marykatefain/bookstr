
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserBooks,
  fetchUserReviews,
  fetchUserPosts,
  getCurrentUser,
  isLoggedIn
} from "@/lib/nostr";
import { Book } from "@/lib/nostr/types";

// Helper functions for getting book information
const getBookByISBN = (library: any, isbn?: string) => {
  if (!isbn || !library) return null;
  
  // Check in each collection
  const tbrBook = library.tbr?.find((book: Book) => book.isbn === isbn);
  if (tbrBook) return { ...tbrBook, readingStatus: { ...tbrBook.readingStatus, status: 'tbr' } };
  
  const readingBook = library.reading?.find((book: Book) => book.isbn === isbn);
  if (readingBook) return { ...readingBook, readingStatus: { ...readingBook.readingStatus, status: 'reading' } };
  
  const readBook = library.read?.find((book: Book) => book.isbn === isbn);
  if (readBook) return { ...readBook, readingStatus: { ...readBook.readingStatus, status: 'finished' } };
  
  return null;
};

const getBookReadingStatus = (library: any, isbn?: string) => {
  if (!isbn || !library) return null;
  
  if (library.tbr?.some((book: Book) => book.isbn === isbn)) return 'tbr';
  if (library.reading?.some((book: Book) => book.isbn === isbn)) return 'reading';
  if (library.read?.some((book: Book) => book.isbn === isbn)) return 'finished';
  
  return null;
};

async function fetchLibraryData(context: any) {
  const pubkey = context?.meta?.pubkey;
  
  if (!pubkey) {
    console.warn("No pubkey provided, returning empty library data");
    return { tbr: [], reading: [], read: [] };
  }
  
  try {
    const library = await fetchUserBooks(pubkey);
    return library;
  } catch (error) {
    console.error("Error fetching library data:", error);
    throw error;
  }
}

async function fetchUserReviewsData(context: any) {
  const pubkey = context?.meta?.pubkey;
  
  if (!pubkey) {
    console.warn("No pubkey provided, returning empty reviews data");
    return [];
  }
  
  try {
    const reviews = await fetchUserReviews(pubkey);
    return reviews;
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    throw error;
  }
}

async function fetchUserPostsData(context: any) {
  const pubkey = context?.meta?.pubkey;
  
  if (!pubkey) {
    console.warn("No pubkey provided, returning empty posts data");
    return [];
  }
  
  try {
    const posts = await fetchUserPosts(pubkey, false);
    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
}

export function useUserLibrary(pubkey: string) {
  const {
    data: library = { tbr: [], reading: [], read: [] },
    isLoading: libraryLoading,
    error: libraryError,
    refetch: refetchLibrary
  } = useQuery({
    queryKey: ['userLibrary', pubkey],
    queryFn: async () => fetchUserBooks(pubkey),
    enabled: !!pubkey
  });

  return {
    library,
    libraryLoading,
    libraryError,
    refetchLibrary
  };
}

export function useLibraryData() {
  const user = getCurrentUser();
  const queryClient = useQueryClient();
  
  const {
    data: library = { tbr: [], reading: [], read: [] },
    isLoading: libraryLoading,
    error: libraryError,
    refetch: refetchLibrary
  } = useQuery({
    queryKey: ['library'],
    queryFn: () => fetchLibraryData({ meta: { pubkey: user?.pubkey } }),
    enabled: isLoggedIn()
  });

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews
  } = useQuery({
    queryKey: ['userReviews', user?.pubkey],
    queryFn: () => fetchUserReviewsData({ meta: { pubkey: user?.pubkey } }),
    enabled: !!user?.pubkey
  });

  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['userPosts', user?.pubkey],
    queryFn: () => fetchUserPostsData({ meta: { pubkey: user?.pubkey } }),
    enabled: !!user?.pubkey
  });

  // Add helper functions to make them available throughout the app
  return {
    user,
    library,
    libraryLoading,
    libraryError,
    refetchLibrary,
    reviews,
    reviewsLoading,
    reviewsError,
    refetchReviews,
    posts,
    postsLoading,
    postsError,
    refetchPosts,
    books: library,
    booksLoading: libraryLoading,
    refetchBooks: refetchLibrary,
    getBookByISBN: (isbn?: string) => getBookByISBN(library, isbn),
    getBookReadingStatus: (isbn?: string) => getBookReadingStatus(library, isbn)
  };
}
