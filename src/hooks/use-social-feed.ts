import { useState, useEffect, useRef } from "react";
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
  const hasLoadedDataRef = useRef(false);
  const activitiesRef = useRef<SocialActivity[]>([]);
  
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

  // Keep track of data we've already loaded
  useEffect(() => {
    if (activities.length > 0) {
      hasLoadedDataRef.current = true;
      activitiesRef.current = activities;
    }
  }, [activities]);

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
      isBackgroundRefresh,
      hasLoadedData: hasLoadedDataRef.current,
      activitiesLength: activitiesRef.current.length
    });

    if (providedActivities) {
      console.log("useSocialFeed: Using provided activities", providedActivities.length);
      return;
    }

    // Only fetch on initial load or explicit refresh
    if (!hasLoadedDataRef.current || refreshTrigger > 0) {
      if (isBackgroundRefresh && activitiesRef.current.length > 0) {
        loadFeedInBackground();
      } else {
        fetchFeed();
      }
    }
  }, [
    refreshTrigger, 
    type, 
    providedActivities, 
    useMockData, 
    maxItems, 
    fetchFeed, 
    isBackgroundRefresh
  ]);

  // Define the refreshFeed function that will be exposed in the return object
  const refreshFeed = async () => {
    console.log("Manual refresh triggered from useSocialFeed");
    return fetchFeed();
  };

  // Use cached data if we have it while loading new data
  const finalActivities = providedActivities || 
    (loading && hasLoadedDataRef.current ? activitiesRef.current : activities);

  return {
    activities: finalActivities,
    loading: loading && !hasLoadedDataRef.current, // Only show loading on first load
    backgroundLoading,
    error,
    refreshFeed
  };
}
