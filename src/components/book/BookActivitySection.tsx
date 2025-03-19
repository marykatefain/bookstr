
import React, { useEffect, useState } from "react";
import { SocialActivity, Reply } from "@/lib/nostr/types";
import { ActivityCard } from "@/components/social/ActivityCard";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";
import { PostCard } from "@/components/post/PostCard";
import { fetchReplies } from "@/lib/nostr";

interface BookActivitySectionProps {
  bookActivity: SocialActivity[];
  loadingActivity: boolean;
  handleReactToActivity: (activityId: string) => void;
  refreshTrigger?: number;
}

export const BookActivitySection: React.FC<BookActivitySectionProps> = ({
  bookActivity,
  loadingActivity,
  handleReactToActivity,
  refreshTrigger
}) => {
  const [activitiesWithReplies, setActivitiesWithReplies] = useState<SocialActivity[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    if (bookActivity.length > 0) {
      fetchRepliesForActivities();
    } else {
      setActivitiesWithReplies([]);
    }
  }, [bookActivity, refreshTrigger]);

  const fetchRepliesForActivities = async () => {
    setLoadingReplies(true);
    try {
      const activitiesWithReplies = await Promise.all(
        bookActivity.map(async (activity) => {
          try {
            const replies = await fetchReplies(activity.id);
            return {
              ...activity,
              replies
            };
          } catch (error) {
            console.error(`Error fetching replies for activity ${activity.id}:`, error);
            return activity;
          }
        })
      );
      setActivitiesWithReplies(activitiesWithReplies);
    } catch (error) {
      console.error("Error fetching replies for activities:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  if (loadingActivity || (loadingReplies && activitiesWithReplies.length === 0)) {
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
      {activitiesWithReplies.map(activity => {
        if (activity.type === 'post') {
          return (
            <PostCard 
              key={`${activity.id}-${refreshTrigger}`} 
              post={activity} 
              onReaction={handleReactToActivity} 
            />
          );
        }
        return (
          <ActivityCard 
            key={`${activity.id}-${refreshTrigger}`} 
            activity={activity} 
            onReaction={handleReactToActivity} 
          />
        );
      })}
    </div>
  );
}
