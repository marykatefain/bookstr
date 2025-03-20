
import React from "react";
import { PostCard } from "@/components/post/PostCard";
import { Post } from "@/lib/nostr/types";

interface UserPostsTabProps {
  posts: Post[];
  postsLoading: boolean;
}

export const UserPostsTab: React.FC<UserPostsTabProps> = ({ posts, postsLoading }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Posts</h2>
      
      {postsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};
