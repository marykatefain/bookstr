
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Book, Post } from "@/lib/nostr/types";
import { fetchUserBooks, getCurrentUser, isLoggedIn } from "@/lib/nostr";
import { fetchBookPosts } from "@/lib/nostr/fetch/socialFetch";

export const useLibraryData = () => {
  const [booksLoading, setBooksLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [books, setBooks] = useState<{
    tbr: Book[];
    reading: Book[];
    read: Book[];
  }>({
    tbr: [],
    reading: [],
    read: [],
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn()) {
        setBooksLoading(false);
        setPostsLoading(false);
        return;
      }

      try {
        setBooksLoading(true);
        const userBooks = await fetchUserBooks(user?.pubkey);
        setBooks(userBooks);
      } catch (error) {
        console.error("Error fetching user books:", error);
        toast({
          title: "Error",
          description: "Failed to load your books",
          variant: "destructive",
        });
      } finally {
        setBooksLoading(false);
      }

      try {
        setPostsLoading(true);
        console.log("Fetching book posts for user:", user?.pubkey);
        const userPosts = await fetchBookPosts(user?.pubkey, false);
        console.log("Fetched posts:", userPosts);
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching user posts:", error);
        toast({
          title: "Error",
          description: "Failed to load your posts",
          variant: "destructive",
        });
      } finally {
        setPostsLoading(false);
      }
    };

    if (user?.pubkey) {
      loadUserData();
    }
  }, [toast, user]);

  return {
    user,
    books,
    posts,
    booksLoading,
    postsLoading,
    isLoggedIn: isLoggedIn(),
  };
};
