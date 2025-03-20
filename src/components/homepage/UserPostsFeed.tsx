
import React, { useEffect } from "react";
import { useUserPosts } from "@/hooks/use-user-posts";
import { PostCard } from "@/components/post/PostCard";
import { isLoggedIn } from "@/lib/nostr";
import { ActivityCard } from "@/components/social/ActivityCard";
import { SocialActivity } from "@/lib/nostr/types";

interface UserPostsFeedProps {
  refreshTrigger?: number;
}

export function UserPostsFeed({ refreshTrigger = 0 }: UserPostsFeedProps) {
  const { activities, loading, fetchPosts } = useUserPosts();

  // Handle reactions for any activity
  const handleReaction = (activityId: string) => {
    // We don't need to refresh the feed here as the UI updates optimistically
    console.log(`Reacted to activity: ${activityId}`);
  };

  // Fetch posts on initial render and when refresh is triggered
  useEffect(() => {
    if (isLoggedIn()) {
      fetchPosts();
    }
  }, [fetchPosts, refreshTrigger]);

  if (!isLoggedIn()) {
    return null;
  }

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-[150px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center mt-6 p-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No activities yet. Create your first post above or add books to your lists!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Your Recent Activity</h3>
      {activities.map(activity => (
        activity.type === 'post' ? (
          <PostCard key={activity.id} post={activity} onReaction={handleReaction} />
        ) : (
          <ActivityCard key={activity.id} activity={activity} onReaction={handleReaction} />
        )
      ))}
    </div>
  );
}
