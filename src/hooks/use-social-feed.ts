
import { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { useFeedFetcher } from "./use-feed-fetcher";

interface UseSocialFeedParams {
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  providedActivities?: SocialActivity[];
  isBackgroundRefresh?: boolean;
  onRefreshComplete?: () => void;
}

interface UseSocialFeedResult {
  activities: SocialActivity[];
  loading: boolean;
  backgroundLoading: boolean;
  error: Error | null;
  refreshFeed: () => Promise<void>;
}

export function useSocialFeed({
  type = "followers",
  useMockData = false,
  maxItems,
  refreshTrigger = 0,
  providedActivities,
  isBackgroundRefresh = false,
  onRefreshComplete
}: UseSocialFeedParams): UseSocialFeedResult {
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  // Use the core feed fetcher
  const { 
    activities, 
    loading, 
    error, 
    fetchFeed 
  } = useFeedFetcher({
    type,
    maxItems,
    useMockData,
    isBackgroundRefresh,
    onComplete: onRefreshComplete
  });

  // Function for background refresh
  const loadFeedInBackground = async () => {
    if (backgroundLoading || loading) return;
    
    setBackgroundLoading(true);
    await fetchFeed();
    setBackgroundLoading(false);
  };

  // Effect to load feed based on refresh trigger
  useEffect(() => {
    console.log(`useSocialFeed: ${type} feed, useMockData: ${useMockData}`, { 
      refreshTrigger, 
      maxItems,
      isBackgroundRefresh
    });

    if (providedActivities) {
      console.log("useSocialFeed: Using provided activities", providedActivities.length);
      return;
    }

    if (isBackgroundRefresh && activities.length > 0) {
      loadFeedInBackground();
    } else {
      fetchFeed();
    }
  }, [
    refreshTrigger, 
    type, 
    providedActivities, 
    useMockData, 
    maxItems, 
    fetchFeed, 
    isBackgroundRefresh, 
    activities.length
  ]);

  // Define the refreshFeed function that will be exposed in the return object
  const refreshFeed = async () => {
    console.log("Manual refresh triggered from useSocialFeed");
    return fetchFeed();
  };

  return {
    activities: providedActivities || activities,
    loading,
    backgroundLoading,
    error,
    refreshFeed
  };
}
