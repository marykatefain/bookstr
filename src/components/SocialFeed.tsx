
import React, { useEffect } from "react";
import { isLoggedIn } from "@/lib/nostr";
import { useSocialFeed } from "@/hooks/use-social-feed";
import { useFeedReactions } from "@/hooks/use-feed-reactions";
import { FeedContent } from "./social/FeedContent";
import { EmptyFeedState } from "./social/EmptyFeedState";
import { FeedLoadingState } from "./social/FeedLoadingState";
import { FeedLoginState } from "./social/FeedLoginState";
import { FeedErrorState } from "./social/FeedErrorState";
import { SocialActivity } from "@/lib/nostr/types";
import { getConnectionStatus } from "@/lib/nostr/relay";

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
  activities: providedActivities, 
  type = "followers", 
  useMockData = false, 
  maxItems,
  refreshTrigger = 0,
  isBackgroundRefresh = false,
  onRefreshComplete
}: SocialFeedProps) {
  const { 
    activities, 
    loading, 
    backgroundLoading, 
    error,
    refreshFeed
  } = useSocialFeed({
    type,
    useMockData,
    maxItems,
    refreshTrigger,
    providedActivities,
    isBackgroundRefresh
  });

  const { activities: reactiveActivities, handleReact } = useFeedReactions(activities);
  
  // Call onRefreshComplete when loading or backgroundLoading changes to false
  useEffect(() => {
    if ((!loading && !backgroundLoading) && onRefreshComplete) {
      onRefreshComplete();
    }
  }, [loading, backgroundLoading, onRefreshComplete]);

  const handleFindFriends = () => {
    // Find and click the find-friends tab
    const findFriendsTab = document.querySelector('[value="find-friends"]');
    if (findFriendsTab && findFriendsTab instanceof HTMLElement) {
      findFriendsTab.click();
    }
  };

  // Show connection status or error
  const connectionStatus = getConnectionStatus();
  const isDisconnected = connectionStatus === 'disconnected';
  
  // Show loading state only when initially loading and there are no activities yet
  if (loading && reactiveActivities.length === 0) {
    return <FeedLoadingState />;
  }

  // Show error state when there's an error
  if (error && reactiveActivities.length === 0) {
    return <FeedErrorState error={error} onRetry={refreshFeed} />;
  }

  // Show disconnected state
  if (isDisconnected && reactiveActivities.length === 0 && !loading) {
    return <FeedErrorState 
      error={new Error("Not connected to any relays")} 
      onRetry={refreshFeed} 
      isConnectionIssue={true}
    />;
  }

  // Login state for followers feed
  if (!isLoggedIn() && type === "followers") {
    return <FeedLoginState feedType={type} />;
  }

  // Empty state when there are no activities
  if (reactiveActivities.length === 0) {
    return <EmptyFeedState type={type} onFindFriends={handleFindFriends} />;
  }

  // Render the feed content with activities
  return <FeedContent 
    activities={reactiveActivities} 
    onReaction={handleReact} 
    refreshTrigger={refreshTrigger}
  />;
}
