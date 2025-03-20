
import React, { useState } from "react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { SocialFeed } from "@/components/SocialFeed";
import { FeedHeader } from "./social/FeedHeader";
import { GuestFeedCard } from "./social/GuestFeedCard";
import { useSocialSectionSync } from "./social/useSocialSectionSync";
import { useAutoRefresh } from "./social/useAutoRefresh";
import { useManualRefresh } from "./social/useManualRefresh";

export function SocialSection() {
  const [feedType, setFeedType] = useState<"followers" | "global">("global");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  
  // This function will be passed to the CreatePostBox to trigger feed refresh
  const refreshFeed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Hook for initial sync and connection
  const { 
    autoRefreshTimerRef, 
    lastManualRefreshRef, 
    debouncedRefresh 
  } = useSocialSectionSync(refreshFeed);

  // Hook for auto refresh functionality
  useAutoRefresh({
    feedType,
    autoRefreshTimerRef,
    refreshFeed: debouncedRefresh,
    setIsBackgroundRefreshing
  });

  // Hook for manual refresh functionality
  const { handleManualRefresh } = useManualRefresh({
    lastManualRefreshRef,
    setManualRefreshing,
    setRefreshTrigger
  });

  return (
    <div className="flex flex-col space-y-4">
      <FeedHeader
        feedType={feedType}
        setFeedType={setFeedType}
        onRefresh={handleManualRefresh}
        isRefreshing={manualRefreshing || isBackgroundRefreshing}
        isLoggedIn={isLoggedIn()}
      />
      
      <div className="mb-6">
        {isLoggedIn() ? (
          <CreatePostBox onPostSuccess={refreshFeed} />
        ) : (
          <GuestFeedCard />
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <SocialFeed 
          type={feedType} 
          useMockData={false} 
          refreshTrigger={refreshTrigger} 
          isBackgroundRefresh={isBackgroundRefreshing}
          onRefreshComplete={() => {
            setIsBackgroundRefreshing(false);
            setManualRefreshing(false);
          }}
        />
      </div>
    </div>
  );
}
