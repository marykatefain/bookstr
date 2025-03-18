
import React from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { ActivityCard } from "@/components/social/ActivityCard";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";
import { PostCard } from "@/components/post/PostCard";

interface BookActivitySectionProps {
  bookActivity: SocialActivity[];
  loadingActivity: boolean;
  handleReactToActivity: (activityId: string) => void;
}

export const BookActivitySection: React.FC<BookActivitySectionProps> = ({
  bookActivity,
  loadingActivity,
  handleReactToActivity
}) => {
  if (loadingActivity) {
    return <FeedLoadingState />;
  }
  
  if (!bookActivity || bookActivity.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No community activity for this book yet. Be the first to post or review!
      </p>
    );
  }
  
  return (
    <div className="space-y-4">
      {bookActivity.map(activity => {
        if (activity.type === 'post') {
          return (
            <PostCard 
              key={activity.id} 
              post={activity} 
              onReaction={handleReactToActivity} 
            />
          );
        }
        return (
          <ActivityCard 
            key={activity.id} 
            activity={activity} 
            onReaction={handleReactToActivity} 
          />
        );
      })}
    </div>
  );
}
