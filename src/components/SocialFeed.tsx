import React, { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed, 
  isLoggedIn,
  reactToContent
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
}

export function SocialFeed({ 
  activities, 
  type = "followers", 
  useMockData = false, 
  maxItems,
  refreshTrigger = 0
}: SocialFeedProps) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!activities) {
      loadSocialFeed();
    }
  }, [refreshTrigger, type]);

  useEffect(() => {
    if (activities) {
      setLocalActivities(activities);
      setLoading(false);
      return;
    }

    loadSocialFeed();
  }, [activities, type, useMockData, maxItems]);

  const loadSocialFeed = async () => {
    setLoading(true);
    try {
      if (useMockData) {
        // We'll use mock data from fetchBookPosts
        console.log("Using mock data for social feed");
        
        // Create mock social activities that look like posts
        setTimeout(() => {
          setLocalActivities([]);
          setLoading(false);
        }, 800);
      } else {
        // This is the default branch: fetch real activities from the network
        console.log(`Fetching ${type} feed from Nostr network`);
        
        let feed: SocialActivity[] = [];
        
        if (type === "followers") {
          feed = await fetchSocialFeed(maxItems || 20);
        } else {
          // Global feed uses the fetchGlobalSocialFeed function
          feed = await fetchGlobalSocialFeed(maxItems || 30);
        }
        
        console.log(`Received ${feed.length} activities from Nostr network`);
        
        // Apply maxItems limit if specified
        if (maxItems && feed.length > maxItems) {
          feed = feed.slice(0, maxItems);
        }
        
        setLocalActivities(feed);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading social feed:", error);
      setLoading(false);
      
      // Show a toast for the error
      toast({
        title: "Error loading feed",
        description: "Could not load activities from the Nostr network. Check your connection.",
        variant: "destructive"
      });
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
      
      setLocalActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              reactions: {
                count: (activity.reactions?.count || 0) + 1,
                userReacted: true
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

  if (loading) {
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
