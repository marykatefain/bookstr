
import React, { memo } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { ActivityCard } from "./ActivityCard";
import { PostCard } from "../post/PostCard";

interface FeedContentProps {
  activities: SocialActivity[];
  onReaction: (activityId: string) => void;
  refreshTrigger?: number;
}

// Memoize individual activity items to prevent unnecessary re-renders
const MemoizedActivityCard = memo(ActivityCard);
const MemoizedPostCard = memo(PostCard);

export function FeedContent({ activities, onReaction, refreshTrigger }: FeedContentProps) {
  // This component is kept for use in other parts of the application,
  // but has been removed from the home page
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        // Use just the ID as the key since we're using memo to prevent re-renders
        const key = activity.id;
        
        if (activity.type === 'post') {
          return (
            <MemoizedPostCard
              key={key}
              post={activity}
              onReaction={onReaction}
            />
          );
        }
        return (
          <MemoizedActivityCard 
            key={key} 
            activity={activity} 
            onReaction={onReaction} 
          />
        );
      })}
    </div>
  );
}
