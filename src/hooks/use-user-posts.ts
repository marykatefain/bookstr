
import { useCallback, useState } from "react";
import { Post } from "@/lib/nostr/types";
import { fetchUserPosts } from "@/lib/nostr/posts";
import { getCurrentUser } from "@/lib/nostr";

export function useUserPosts(limit: number = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.pubkey) {
        setPosts([]);
        return;
      }

      const userPosts = await fetchUserPosts(currentUser.pubkey, false);
      setPosts(userPosts);
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch posts"));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts
  };
}
