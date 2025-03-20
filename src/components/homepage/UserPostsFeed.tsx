
import React, { useEffect } from "react";
import { useUserPosts } from "@/hooks/use-user-posts";
import { PostCard } from "@/components/post/PostCard";
import { isLoggedIn } from "@/lib/nostr";

interface UserPostsFeedProps {
  refreshTrigger?: number;
}

export function UserPostsFeed({ refreshTrigger = 0 }: UserPostsFeedProps) {
  const { posts, loading, fetchPosts } = useUserPosts();

  // Fetch posts on initial render and when refresh is triggered
  useEffect(() => {
    if (isLoggedIn()) {
      fetchPosts();
    }
  }, [fetchPosts, refreshTrigger]);

  if (!isLoggedIn()) {
    return null;
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-[150px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center mt-6 p-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No posts yet. Create your first post above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Your Recent Posts</h3>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
