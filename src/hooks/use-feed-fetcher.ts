
import { useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { useFeedRetry } from "./use-feed-retry";
import { useFeedCore } from "./feed/use-feed-core";
import { useFeedData } from "./feed/use-feed-data";

interface UseFeedFetcherOptions {
  type: "followers" | "global";
  maxItems?: number;
  useMockData?: boolean;
  isBackgroundRefresh?: boolean;
  onComplete?: () => void;
  until?: number;
}

interface UseFeedFetcherResult {
  activities: SocialActivity[];
  loading: boolean;
  error: Error | null;
  fetchFeed: () => Promise<void>;
}

export function useFeedFetcher({
  type,
  maxItems,
  useMockData = false,
  isBackgroundRefresh = false,
  onComplete,
  until
}: UseFeedFetcherOptions): UseFeedFetcherResult {
  const previousActivitiesRef = useRef<SocialActivity[]>([]);
  
  // Use our core hook for state management
  const {
    activities,
    loading,
    error,
    isRefreshingRef,
    ensureConnection,
    setLoadingState,
    handleFetchSuccess,
    handleFetchError
  } = useFeedCore({ 
    type,
    maxItems,
    onComplete,
    isBackgroundRefresh,
    until
  });
  
  // Use our data fetching hook
  const { fetchFeedData, canRefresh } = useFeedData({
    type,
    maxItems,
    useMockData,
    until
  });
  
  // Use the retry hook
  const { scheduleRetry, resetRetryCount } = useFeedRetry({
    isBackgroundRefresh,
    onRetryComplete: onComplete
  });

  // Main fetch function with error handling
  const fetchFeed = useCallback(async () => {
    // Prevent multiple concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("Skipping refresh - another refresh is already in progress");
      return;
    }
    
    // For global feed, implement a cooldown to prevent too frequent refreshes
    // (skip this check for pagination requests)
    if (!until && !canRefresh()) {
      console.log(`Skipping global feed refresh due to cooldown`);
      return;
    }
    
    isRefreshingRef.current = true;
    
    if (!isBackgroundRefresh) {
      setLoadingState(true);
      resetRetryCount();
    }
    
    // Ensure we have a connection to relays
    await ensureConnection();
    
    try {
      // Save current activities to ref for comparison in background refresh
      if (isBackgroundRefresh) {
        previousActivitiesRef.current = [...activities];
      }
      
      console.log(`Starting feed data fetch, background: ${isBackgroundRefresh}, pagination: ${until ? 'yes' : 'no'}`);
      const fetchedActivities = await fetchFeedData(isBackgroundRefresh);
      console.log(`Feed data fetch completed, received ${fetchedActivities.length} activities`);
      
      if (isBackgroundRefresh) {
        // Compare with previous feed to see if there are new items
        const newItemsExist = fetchedActivities.some(
          newActivity => !previousActivitiesRef.current.some(
            oldActivity => oldActivity.id === newActivity.id
          )
        );
        
        if (newItemsExist) {
          console.log("New feed items detected during background refresh");
          handleFetchSuccess(fetchedActivities);
        } else {
          console.log("No new items in background refresh");
        }
      } else {
        handleFetchSuccess(fetchedActivities);
      }
    } catch (error) {
      const newError = handleFetchError(error);
      
      if (!isBackgroundRefresh && !until) {
        // Schedule retries for non-background refreshes and non-paginated requests
        scheduleRetry(() => fetchFeedData(false).then(fetchedActivities => {
          handleFetchSuccess(fetchedActivities);
          return Promise.resolve();
        }));
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoadingState(false);
      }
      isRefreshingRef.current = false;
    }
  }, [
    activities, 
    isBackgroundRefresh,
    fetchFeedData,
    canRefresh,
    resetRetryCount, 
    scheduleRetry,
    ensureConnection,
    handleFetchSuccess,
    handleFetchError,
    setLoadingState,
    until
  ]);

  return {
    activities,
    loading,
    error,
    fetchFeed
  };
}
