
import { useQuery } from "@tanstack/react-query";
import { 
  fetchUserProfile, 
  fetchUserBooks,
  fetchUserReviews,
  fetchFollowingList,
  fetchUserPosts,
  getCurrentUser 
} from "@/lib/nostr";
import { nip19 } from "nostr-tools";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";

export function useUserProfile(pubkeyOrNpub: string | undefined) {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Normalize pubkey from npub if needed
  const normalizedPubkey = useMemo(() => {
    if (!pubkeyOrNpub) return "";
    
    // Only try to decode if it starts with 'npub'
    if (pubkeyOrNpub.startsWith('npub')) {
      try {
        const decoded = nip19.decode(pubkeyOrNpub);
        if (decoded.type === 'npub') {
          return decoded.data as string;
        }
      } catch (e) {
        console.error("Error decoding npub:", e);
      }
    }
    
    return pubkeyOrNpub;
  }, [pubkeyOrNpub]);
  
  // Profile query
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['userProfile', normalizedPubkey],
    queryFn: async () => {
      if (!normalizedPubkey) return null;
      
      try {
        return await fetchUserProfile(normalizedPubkey);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
    },
    enabled: !!normalizedPubkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Following status query
  const {
    data: followingStatus,
    isLoading: followingLoading
  } = useQuery({
    queryKey: ['following', currentUser?.pubkey, normalizedPubkey],
    queryFn: async () => {
      if (!normalizedPubkey || !currentUser) return false;
      
      try {
        const { follows } = await fetchFollowingList(currentUser.pubkey);
        return follows.includes(normalizedPubkey);
      } catch (error) {
        console.error("Error checking following status:", error);
        return false;
      }
    },
    enabled: !!normalizedPubkey && !!currentUser,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Books query - only fetched when profile is loaded
  const {
    data: userBooks = { tbr: [], reading: [], read: [] },
    isLoading: booksLoading
  } = useQuery({
    queryKey: ['userBooks', normalizedPubkey],
    queryFn: async () => {
      if (!normalizedPubkey) return { tbr: [], reading: [], read: [] };
      
      try {
        return await fetchUserBooks(normalizedPubkey);
      } catch (error) {
        console.error("Error fetching user books:", error);
        throw error;
      }
    },
    enabled: !!normalizedPubkey && !!profile,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Reviews query - only fetched when profile is loaded
  const {
    data: reviews = [],
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['userReviews', normalizedPubkey],
    queryFn: async () => {
      if (!normalizedPubkey) return [];
      
      try {
        return await fetchUserReviews(normalizedPubkey);
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        throw error;
      }
    },
    enabled: !!normalizedPubkey && !!profile,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Posts query - lazily fetched
  const {
    data: posts = [],
    isLoading: postsLoading,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['userPosts', normalizedPubkey],
    queryFn: async () => {
      if (!normalizedPubkey) return [];
      
      try {
        return await fetchUserPosts(normalizedPubkey, false);
      } catch (error) {
        console.error("Error fetching user posts:", error);
        toast({
          title: "Error",
          description: "Could not load user's posts",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!normalizedPubkey && !!profile,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const isLoading = profileLoading || followingLoading;
  const totalBooks = userBooks.tbr.length + userBooks.reading.length + userBooks.read.length;
  
  return {
    profile,
    following: followingStatus || false,
    userBooks,
    reviews,
    posts,
    isLoading,
    postsLoading,
    booksLoading,
    reviewsLoading,
    totalBooks,
    refetchPosts
  };
}
