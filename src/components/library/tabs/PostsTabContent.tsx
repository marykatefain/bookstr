
import React from "react";
import { EmptyState } from "@/components/profile/EmptyState";
import { PostCard } from "@/components/post/PostCard";
import { Post } from "@/lib/nostr/types";

interface PostsTabContentProps {
  posts: Post[];
  isLoading: boolean;
}

export const PostsTabContent: React.FC<PostsTabContentProps> = ({ posts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[200px]"></div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-8">
        <EmptyState 
          title="No posts yet" 
          description="Search for books to add to your library"
          actionText="Search for Books"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
