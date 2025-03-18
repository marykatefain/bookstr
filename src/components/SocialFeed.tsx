
import React, { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchSocialFeed, reactToContent, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { ActivityCard } from "./social/ActivityCard";
import { EmptyFeedState } from "./social/EmptyFeedState";
import { FeedLoadingState } from "./social/FeedLoadingState";
import { Card } from "@/components/ui/card";
import { mockFollowersActivities, mockGlobalActivities } from "@/lib/nostr/mockData";

interface SocialFeedProps {
  activities?: SocialActivity[];
  type?: "followers" | "global";
  useMockData?: boolean;
}

export function SocialFeed({ activities, type = "followers", useMockData = true }: SocialFeedProps) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (activities) {
      setLocalActivities(activities);
      setLoading(false);
      return;
    }

    const loadSocialFeed = async () => {
      setLoading(true);
      try {
        if (useMockData) {
          setTimeout(() => {
            setLocalActivities(type === "followers" ? mockFollowersActivities : mockGlobalActivities);
            setLoading(false);
          }, 800);
        } else {
          const feed = await fetchSocialFeed(10);
          setLocalActivities(feed);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading social feed:", error);
        setLoading(false);
      }
    };

    loadSocialFeed();
  }, [activities, type, useMockData]);

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
    const findFriendsTab = document.querySelector('[data-value="find-friends"]');
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
      {localActivities.map((activity) => (
        <ActivityCard 
          key={activity.id} 
          activity={activity} 
          onReaction={handleReact} 
        />
      ))}
    </div>
  );
}
