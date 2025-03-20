
import React, { useState, useEffect, useRef } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchGlobalSocialFeed, reactToContent, isLoggedIn, fetchReactions } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { CompactActivityCard } from "./social/CompactActivityCard";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface CompactSocialFeedProps {
  maxItems?: number;
}

export function CompactSocialFeed({ maxItems = 5 }: CompactSocialFeedProps) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const previousActivitiesRef = useRef<SocialActivity[]>([]);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadSocialFeed();
    
    // Set up auto-refresh every 60 seconds
    refreshTimerRef.current = window.setInterval(() => {
      if (activities.length > 0) {
        previousActivitiesRef.current = [...activities];
        loadSocialFeedInBackground();
      } else {
        loadSocialFeed();
      }
    }, 60000); // 60 seconds
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [maxItems]);

  const loadSocialFeed = async () => {
    setLoading(true);
    try {
      await fetchFeedData();
    } catch (error) {
      console.error("Error loading social feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialFeedInBackground = async () => {
    if (backgroundLoading) return;
    
    setBackgroundLoading(true);
    try {
      await fetchFeedData(true);
    } catch (error) {
      console.error("Error during background refresh:", error);
    } finally {
      setBackgroundLoading(false);
    }
  };

  const fetchFeedData = async (isBackground = false) => {
    console.log(`CompactSocialFeed: ${isBackground ? "Background fetching" : "Fetching"} global feed`);
    
    try {
      // Use global feed instead of followers feed
      const globalFeed = await fetchGlobalSocialFeed(maxItems * 2); // Fetch more than needed in case some fail
      console.log("CompactSocialFeed: Received", globalFeed.length, "activities");
      
      if (globalFeed.length === 0) {
        if (!isBackground) {
          setActivities([]);
        }
        return;
      }
      
      // Fetch reactions for each activity
      const activitiesWithReactions = await Promise.all(
        globalFeed.map(async (activity) => {
          try {
            const reactions = await fetchReactions(activity.id);
            return {
              ...activity,
              reactions
            };
          } catch (error) {
            console.error(`Error fetching reactions for activity ${activity.id}:`, error);
            return activity;
          }
        })
      );
      
      const processedFeed = activitiesWithReactions.slice(0, maxItems);
      
      if (isBackground) {
        // Compare with previous feed to detect changes
        const newItemsExist = processedFeed.some(
          newActivity => !previousActivitiesRef.current.some(
            oldActivity => oldActivity.id === newActivity.id
          )
        );
        
        if (newItemsExist) {
          console.log("New items detected in compact feed background refresh");
          setActivities(processedFeed);
        } else {
          console.log("No new items in compact feed background refresh");
        }
      } else {
        setActivities(processedFeed);
      }
    } catch (error) {
      console.error("Error fetching feed data:", error);
      throw error;
    }
  };

  const handleReact = async (activityId: string) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to posts",
        variant: "destructive"
      });
      return;
    }

    try {
      await reactToContent(activityId);
      toast({
        title: "Reaction sent",
        description: "You've reacted to this post"
      });
      
      setActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            const currentUserReacted = activity.reactions?.userReacted || false;
            const currentCount = activity.reactions?.count || 0;
            
            return {
              ...activity,
              reactions: {
                count: currentUserReacted ? currentCount - 1 : currentCount + 1,
                userReacted: !currentUserReacted
              }
            };
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Error reacting to post:", error);
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="ml-auto h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!isLoggedIn()) {
    return (
      <Card className="text-center p-3">
        <p className="text-muted-foreground text-sm">
          Sign in to interact with the community
        </p>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="text-center p-3">
        <p className="text-muted-foreground text-sm">
          No recent activity in the global feed
        </p>
      </Card>
    );
  }

  return (
    <div>
      {activities.map((activity) => (
        <CompactActivityCard 
          key={activity.id} 
          activity={activity} 
          onReaction={handleReact} 
        />
      ))}
      <div className="mt-4 text-center">
        <button 
          onClick={() => navigate('/social')}
          className="text-sm text-bookverse-accent hover:underline"
        >
          View All Activity
        </button>
      </div>
    </div>
  );
}
