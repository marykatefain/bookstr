
import React, { useEffect, useCallback, memo } from "react";
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
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

interface SocialFeedProps {
  activities?: SocialActivity[];
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  isBackgroundRefresh?: boolean;
  onRefreshComplete?: () => void;
}

// Memoize FeedContent to prevent unnecessary re-renders
const MemoizedFeedContent = memo(FeedContent);

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
  
  // Simplified callback for refresh completion
  useEffect(() => {
    if ((!loading && !backgroundLoading) && onRefreshComplete) {
      onRefreshComplete();
    }
  }, [loading, backgroundLoading, onRefreshComplete]);

  const handleFindFriends = useCallback(() => {
    const findFriendsTab = document.querySelector('[value="find-friends"]');
    if (findFriendsTab && findFriendsTab instanceof HTMLElement) {
      findFriendsTab.click();
    }
  }, []);

  const connectionStatus = getConnectionStatus();
  const isDisconnected = connectionStatus === 'disconnected';
  
  // Only show loading state when we have no data
  if (loading && reactiveActivities.length === 0) {
    return <FeedLoadingState />;
  }

  if (error && reactiveActivities.length === 0) {
    return <FeedErrorState error={error} onRetry={refreshFeed} />;
  }

  if (isDisconnected && reactiveActivities.length === 0 && !loading) {
    return <FeedErrorState 
      error={new Error("Not connected to any relays")} 
      onRetry={refreshFeed} 
      isConnectionIssue={true}
    />;
  }

  // Only check login for followers feed
  if (!isLoggedIn() && type === "followers") {
    return <FeedLoginState feedType={type} />;
  }

  if (reactiveActivities.length === 0) {
    return <EmptyFeedState type={type} onFindFriends={handleFindFriends} />;
  }

  return (
    <div>
      {isDisconnected && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500 mr-2" />
            <span className="text-sm text-amber-800 dark:text-amber-400">Connection to Nostr relays lost</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshFeed}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        </div>
      )}
      {backgroundLoading && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 text-center">
          <span className="text-sm text-blue-800 dark:text-blue-400 flex items-center justify-center">
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Refreshing feed...
          </span>
        </div>
      )}
      <MemoizedFeedContent 
        activities={reactiveActivities}
        onReaction={handleReact} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
