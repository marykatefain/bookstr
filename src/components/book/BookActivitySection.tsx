import React, { useEffect, useState, useRef } from "react";
import { SocialActivity, Reply } from "@/lib/nostr/types";
import { ActivityCard } from "@/components/social/ActivityCard";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";
import { PostCard } from "@/components/post/PostCard";
import { fetchReplies, fetchReactions } from "@/lib/nostr";

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
  const [activitiesWithData, setActivitiesWithData] = useState<SocialActivity[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const previousActivitiesRef = useRef<SocialActivity[]>([]);

  useEffect(() => {
    if (bookActivity.length > 0) {
      if (activitiesWithData.length > 0) {
        previousActivitiesRef.current = [...activitiesWithData];
        fetchDataForActivitiesInBackground();
      } else {
        fetchDataForActivities();
      }
    } else {
      setActivitiesWithData([]);
    }
  }, [bookActivity, refreshTrigger]);

  const fetchDataForActivities = async () => {
    setLoadingData(true);
    try {
      await fetchActivityData();
    } catch (error) {
      console.error("Error fetching data for activities:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchDataForActivitiesInBackground = async () => {
    try {
      await fetchActivityData(true);
    } catch (error) {
      console.error("Error during background refresh:", error);
    }
  };

  const fetchActivityData = async (isBackground = false) => {
    try {
      const activitiesWithData = await Promise.all(
        bookActivity.map(async (activity) => {
          try {
            const [replies, reactions] = await Promise.all([
              fetchReplies(activity.id),
              fetchReactions(activity.id)
            ]);
            
            return {
              ...activity,
              replies,
              reactions
            };
          } catch (error) {
            console.error(`Error fetching data for activity ${activity.id}:`, error);
            return activity;
          }
        })
      );
      
      if (isBackground) {
        const hasChanges = JSON.stringify(activitiesWithData) !== JSON.stringify(previousActivitiesRef.current);
        if (hasChanges) {
          setActivitiesWithData(activitiesWithData);
        }
      } else {
        setActivitiesWithData(activitiesWithData);
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
      throw error;
    }
  };

  if (loadingActivity || (loadingData && activitiesWithData.length === 0)) {
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
      {activitiesWithData.map(activity => {
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
