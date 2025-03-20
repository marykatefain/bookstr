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
  const initialLoadCompleted = useRef(false);
  const activitiesRef = useRef<SocialActivity[]>([]);
  
  // Use the core feed fetcher
  const { 
    activities: fetchedActivities, 
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

  // Keep track of our activities
  const [stableActivities, setStableActivities] = useState<SocialActivity[]>([]);

  // Update stable activities when new ones arrive, but only if they're different
  useEffect(() => {
    if (fetchedActivities && fetchedActivities.length > 0) {
      setStableActivities(fetchedActivities);
      activitiesRef.current = fetchedActivities;
      initialLoadCompleted.current = true;
    }
  }, [fetchedActivities]);

  // Effect to load feed based on refresh trigger, but only once initially
  useEffect(() => {
    console.log(`useSocialFeed: ${type} feed, useMockData: ${useMockData}`, { 
      refreshTrigger, 
      maxItems,
      isBackgroundRefresh,
      hasLoadedData: initialLoadCompleted.current,
      activitiesLength: activitiesRef.current.length
    });

    // If we have provided activities, don't fetch
    if (providedActivities) {
      console.log("useSocialFeed: Using provided activities", providedActivities.length);
      return;
    }

    // If we haven't loaded data yet, do a full fetch
    if (!initialLoadCompleted.current) {
      console.log("useSocialFeed: Initial load");
      fetchFeed();
    } 
    // Only do a background refresh if explicitly requested AND we already have data
    else if (isBackgroundRefresh && refreshTrigger > 0) {
      console.log("useSocialFeed: Background refresh");
      setBackgroundLoading(true);
      fetchFeed().finally(() => {
        setBackgroundLoading(false);
      });
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

  // Use provided activities, or stable activities, falling back to fetched activities
  const finalActivities = providedActivities || stableActivities.length > 0 ? stableActivities : fetchedActivities;

  return {
    activities: finalActivities,
    loading: loading && !initialLoadCompleted.current, // Only show loading on initial load
    backgroundLoading,
    error,
    refreshFeed
  };
}
