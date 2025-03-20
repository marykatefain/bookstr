
import React, { useState, useEffect, useRef } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed, 
  isLoggedIn,
  reactToContent,
  fetchReplies,
  fetchReactions
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { ActivityCard } from "./social/ActivityCard";
import { EmptyFeedState } from "./social/EmptyFeedState";
import { FeedLoadingState } from "./social/FeedLoadingState";
import { Card } from "@/components/ui/card";
import { PostCard } from "./post/PostCard";

interface SocialFeedProps {
  activities?: SocialActivity[];
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  isBackgroundRefresh?: boolean;
  onRefreshComplete?: () => void;
}

export function SocialFeed({ 
  activities, 
  type = "followers", 
  useMockData = false, 
  maxItems,
  refreshTrigger = 0,
  isBackgroundRefresh = false,
  onRefreshComplete
}: SocialFeedProps) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const { toast } = useToast();
  const previousActivitiesRef = useRef<SocialActivity[]>([]);

  // Log information about the feed type
  useEffect(() => {
    console.log(`SocialFeed component: ${type} feed, useMockData: ${useMockData}`, { 
      refreshTrigger, 
      maxItems,
      isBackgroundRefresh
    });
  }, [type, useMockData, refreshTrigger, maxItems, isBackgroundRefresh]);

  useEffect(() => {
    if (!activities) {
      if (isBackgroundRefresh && localActivities.length > 0) {
        loadSocialFeedInBackground();
      } else {
        loadSocialFeed();
      }
    }
  }, [refreshTrigger, type]);

  useEffect(() => {
    if (activities) {
      console.log("SocialFeed: Using provided activities", activities.length);
      setLocalActivities(activities);
      setLoading(false);
      return;
    }

    if (isBackgroundRefresh && localActivities.length > 0) {
      loadSocialFeedInBackground();
    } else {
      loadSocialFeed();
    }
  }, [activities, type, useMockData, maxItems]);

  const loadSocialFeed = async () => {
    setLoading(true);
    try {
      await fetchFeedData();
    } catch (error) {
      handleFeedError(error);
    } finally {
      setLoading(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const loadSocialFeedInBackground = async () => {
    if (backgroundLoading) return;
    
    setBackgroundLoading(true);
    try {
      // Save current activities to ref for comparison
      previousActivitiesRef.current = [...localActivities];
      await fetchFeedData(true);
    } catch (error) {
      // Don't show error toast for background refreshes
      console.error("Error during background refresh:", error);
    } finally {
      setBackgroundLoading(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const fetchFeedData = async (isBackground = false) => {
    if (useMockData) {
      // We'll use mock data from fetchBookPosts
      console.log("Using mock data for social feed");
      
      // Create mock social activities that look like posts
      if (!isBackground) {
        setTimeout(() => {
          setLocalActivities([]);
        }, 800);
      }
      return;
    }
    
    // This is the default branch: fetch real activities from the network
    console.log(`Fetching ${type} feed from Nostr network`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        feed = await fetchSocialFeed(maxItems || 20);
      } else {
        // Global feed uses the fetchGlobalSocialFeed function
        feed = await fetchGlobalSocialFeed(maxItems || 30);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      throw error;
    }
    
    // If no activities were returned, set an empty array
    if (!feed || feed.length === 0) {
      if (!isBackground) {
        setLocalActivities([]);
      }
      return;
    }
    
    // Fetch replies and reactions for each activity
    const activitiesWithData = await Promise.all(
      feed.map(async (activity) => {
        try {
          const [replies, reactions] = await Promise.all([
            fetchReplies(activity.id),
            fetchReactions(activity.id)
          ]);
          
          return {
            ...activity,
            replies,
            reactions: reactions
          };
        } catch (error) {
          console.error(`Error fetching data for activity ${activity.id}:`, error);
          return activity;
        }
      })
    );
    
    // Apply maxItems limit if specified
    let processedFeed = activitiesWithData;
    if (maxItems && processedFeed.length > maxItems) {
      processedFeed = processedFeed.slice(0, maxItems);
    }
    
    if (isBackground) {
      // Compare with previous feed to see if there are new items
      const newItemsExist = processedFeed.some(
        newActivity => !previousActivitiesRef.current.some(
          oldActivity => oldActivity.id === newActivity.id
        )
      );
      
      if (newItemsExist) {
        console.log("New feed items detected during background refresh");
        setLocalActivities(processedFeed);
      } else {
        console.log("No new items in background refresh");
      }
    } else {
      setLocalActivities(processedFeed);
    }
  };

  const handleFeedError = (error: any) => {
    console.error("Error loading social feed:", error);
    
    // Show a toast for the error
    toast({
      title: "Error loading feed",
      description: "Could not load activities from the Nostr network. Check your connection.",
      variant: "destructive"
    });
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
      
      setLocalActivities(prevActivities => 
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

  const handleFindFriends = () => {
    // Find and click the find-friends tab
    const findFriendsTab = document.querySelector('[value="find-friends"]');
    if (findFriendsTab && findFriendsTab instanceof HTMLElement) {
      findFriendsTab.click();
    }
  };

  if (loading && localActivities.length === 0) {
    return <FeedLoadingState />;
  }

  if (!isLoggedIn() && type === "followers") {
    return (
      <Card className="text-center p-6">
        <p className="text-muted-foreground mb-4">
          Sign in to see updates from people you follow
        </p>
      </Card>
    );
  }

  if (localActivities.length === 0) {
    return <EmptyFeedState type={type} onFindFriends={handleFindFriends} />;
  }

  return (
    <div className="space-y-4">
      {localActivities.map((activity) => {
        if (activity.type === 'post') {
          return (
            <PostCard
              key={activity.id}
              post={activity}
              onReaction={handleReact}
            />
          );
        }
        return (
          <ActivityCard 
            key={activity.id} 
            activity={activity} 
            onReaction={handleReact} 
          />
        );
      })}
    </div>
  );
}
