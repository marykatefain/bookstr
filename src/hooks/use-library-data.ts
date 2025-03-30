
import { useState, useEffect } from "react";
import { 
  getCurrentUser, 
  fetchProfileData,
  fetchUserBooks,
  fetchUserReviews,
  fetchUserPosts
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { Book, BookReview, Post } from "@/lib/nostr/types";

export function useLibraryData() {
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [books, setBooks] = useState<{
    tbr: Book[],
    reading: Book[],
    read: Book[]
  }>({ tbr: [], reading: [], read: [] });
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchBooks = async () => {
    if (!user?.pubkey) return;
    
    setBooksLoading(true);
    try {
      const userBooks = await fetchUserBooks(user.pubkey);
      setBooks(userBooks);
    } catch (error) {
      console.error("Error fetching user books:", error);
      toast({
        title: "Error",
        description: "Could not load your books",
        variant: "destructive"
      });
    } finally {
      setBooksLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!user?.pubkey) return;
    
    setReviewsLoading(true);
    try {
      const userReviews = await fetchUserReviews(user.pubkey);
      setReviews(userReviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!user?.pubkey) return;
    
    setPostsLoading(true);
    try {
      const userPosts = await fetchUserPosts(user.pubkey);
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.pubkey) {
      // Get the latest profile data
      fetchProfileData(user.pubkey)
        .then(profileData => {
          if (profileData) {
            setUser(prev => prev ? { ...prev, ...profileData } : prev);
          }
        })
        .catch(error => {
          console.error("Error fetching profile data:", error);
        });

      fetchBooks();
      fetchReviews();
      fetchPosts();
    }
  }, [user?.pubkey]);

  const refetchBooks = () => {
    fetchBooks();
  };

  return {
    user,
    setUser,
    books,
    reviews,
    posts,
    booksLoading,
    reviewsLoading,
    postsLoading,
    refetchBooks
  };
}
