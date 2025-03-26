import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserBooks,
  fetchUserReviews,
  fetchUserPosts,
  getCurrentUser,
  isLoggedIn
} from "@/lib/nostr";

async function fetchLibraryData(pubkey?: string) {
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

async function fetchUserReviewsData(pubkey?: string) {
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

async function fetchUserPostsData(pubkey?: string) {
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
  const queryClient = useQueryClient();
  
  const initialLibrary = () => {
    const cachedLibrary = queryClient.getQueryData(['library']) as any;
    if (cachedLibrary) {
      return cachedLibrary;
    }
    return { tbr: [], reading: [], read: [] };
  };
  
  const {
    data: library,
    isLoading: libraryLoading,
    error: libraryError,
    refetch: refetchLibrary
  } = useQuery({
    queryKey: ['userLibrary', pubkey],
    queryFn: fetchLibraryData,
    initialData: () => {
      const cachedLibrary = queryClient.getQueryData(['library']) as any;
      if (cachedLibrary) {
        return cachedLibrary;
      }
      return { tbr: [], reading: [], read: [] };
    },
    placeholderData: (previousData) => previousData,
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
  
  const initialLibrary = () => {
    if (!isLoggedIn()) return { tbr: [], reading: [], read: [] };
    
    const cachedLibrary = queryClient.getQueryData(['library']) as any;
    if (cachedLibrary) {
      return cachedLibrary;
    }
    return { tbr: [], reading: [], read: [] };
  };

  const initialReviews = () => {
    if (!isLoggedIn()) return [];
    
    const cachedReviews = queryClient.getQueryData(['userReviews', user?.pubkey]) as any;
    if (cachedReviews) {
      return cachedReviews;
    }
    return [];
  };

  const initialPosts = () => {
    if (!isLoggedIn()) return [];
    
    const cachedPosts = queryClient.getQueryData(['userPosts', user?.pubkey]) as any;
    if (cachedPosts) {
      return cachedPosts;
    }
    return [];
  };
  
  const {
    data: library,
    isLoading: libraryLoading,
    error: libraryError,
    refetch: refetchLibrary
  } = useQuery({
    queryKey: ['library'],
    queryFn: fetchLibraryData,
    placeholderData: (previousData) => previousData,
    enabled: isLoggedIn()
  });

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews
  } = useQuery({
    queryKey: ['userReviews', user?.pubkey],
    queryFn: fetchUserReviewsData,
    placeholderData: (previousData) => previousData,
    enabled: !!user?.pubkey
  });

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['userPosts', user?.pubkey],
    queryFn: fetchUserPostsData,
    placeholderData: (previousData) => previousData,
    enabled: !!user?.pubkey
  });

  return {
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
    refetchPosts
  };
}
