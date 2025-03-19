
import React, { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchSocialFeed, reactToContent, isLoggedIn } from "@/lib/nostr";
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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSocialFeed = async () => {
      setLoading(true);
      try {
        // Use real data instead of mock data
        const realFeed = await fetchSocialFeed(maxItems);
        setActivities(realFeed.slice(0, maxItems));
        setLoading(false);
      } catch (error) {
        console.error("Error loading social feed:", error);
        setLoading(false);
      }
    };

    loadSocialFeed();
  }, [maxItems]);

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

  if (loading) {
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
          Sign in to see updates from people you follow
        </p>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="text-center p-3">
        <p className="text-muted-foreground text-sm">
          No recent activity from people you follow
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
