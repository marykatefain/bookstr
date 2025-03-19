
import React, { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchSocialFeed, reactToContent, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { ActivityCard } from "./social/ActivityCard";
import { EmptyFeedState } from "./social/EmptyFeedState";
import { FeedLoadingState } from "./social/FeedLoadingState";
import { Card } from "@/components/ui/card";
import { fetchPosts } from "@/lib/nostr/posts";
import { PostCard } from "./post/PostCard";

interface SocialFeedProps {
  activities?: SocialActivity[];
  type?: "followers" | "global";
  useMockData?: boolean;
}

export function SocialFeed({ activities, type = "followers", useMockData = false }: SocialFeedProps) {
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
          // This branch is no longer the default, it's only kept for testing/fallback
          const posts = await fetchPosts(10, true);
          const postActivities = posts.map(post => ({
            id: post.id,
            pubkey: post.pubkey,
            type: 'post' as const,
            book: {
              id: post.taggedBook?.isbn || '',
              title: post.taggedBook?.title || '',
              author: '',
              isbn: post.taggedBook?.isbn || '',
              coverUrl: post.taggedBook?.coverUrl || '',
            },
            content: post.content,
            createdAt: post.createdAt,
            author: post.author,
            reactions: post.reactions,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            isSpoiler: post.isSpoiler
          }));
          
          // Get the base activities
          const baseActivities = type === "followers" ? [] : [];
          
          // Combine and sort all activities by date
          const allActivities = [...baseActivities, ...postActivities].sort((a, b) => b.createdAt - a.createdAt);
          
          setTimeout(() => {
            setLocalActivities(allActivities);
            setLoading(false);
          }, 800);
        } else {
          // This is now the default branch: fetch real activities from the network
          console.log(`Fetching ${type} feed from Nostr network`);
          
          // For global feed we'd need a different function, but we'll use the same one for now
          // TODO: implement separate global feed fetching
          const feed = await fetchSocialFeed(type === "followers" ? 20 : 30);
          
          console.log(`Received ${feed.length} activities from Nostr network`);
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

    loadSocialFeed();
  }, [activities, type, useMockData, toast]);

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
