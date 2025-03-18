
import React from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { ActivityCard } from "@/components/social/ActivityCard";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";

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
  
  if (bookActivity.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No community activity for this book yet. Be the first to post or review!
      </p>
    );
  }
  
  return (
    <div className="space-y-4">
      {bookActivity.map(activity => (
        <ActivityCard 
          key={activity.id} 
          activity={activity} 
          onReaction={handleReactToActivity} 
        />
      ))}
    </div>
  );
};
