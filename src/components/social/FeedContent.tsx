
import React, { memo } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { ActivityCard } from "./ActivityCard";
import { PostCard } from "../post/PostCard";

interface FeedContentProps {
  activities: SocialActivity[];
  onReaction: (activityId: string) => void;
  refreshTrigger?: number;
}

// Memoize the component to prevent unnecessary re-renders
export const FeedContent = memo(function FeedContent({ 
  activities, 
  onReaction, 
  refreshTrigger 
}: FeedContentProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        // Add refreshTrigger to the key if provided to force re-render when refreshed
        const key = refreshTrigger ? `${activity.id}-${refreshTrigger}` : activity.id;
        
        if (activity.type === 'post') {
          return (
            <PostCard
              key={key}
              post={activity}
              onReaction={onReaction}
            />
          );
        }
        return (
          <ActivityCard 
            key={key} 
            activity={activity} 
            onReaction={onReaction} 
          />
        );
      })}
    </div>
  );
});
