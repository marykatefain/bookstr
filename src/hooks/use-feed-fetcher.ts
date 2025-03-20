
import { useState, useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed 
} from "@/lib/nostr";
import { useFeedRetry } from "./use-feed-retry";
import { 
  enrichActivitiesWithData,
  canRefreshGlobalFeed,
  updateGlobalRefreshTimestamp
} from "@/lib/nostr/utils/feedUtils";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";
import { toast } from "@/hooks/use-toast";

interface UseFeedFetcherOptions {
  type: "followers" | "global";
  maxItems?: number;
  useMockData?: boolean;
  isBackgroundRefresh?: boolean;
  onComplete?: () => void;
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
  onComplete
}: UseFeedFetcherOptions): UseFeedFetcherResult {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const previousActivitiesRef = useRef<SocialActivity[]>([]);
  const isRefreshingRef = useRef(false);
  
  const { scheduleRetry, resetRetryCount } = useFeedRetry({
    isBackgroundRefresh,
    onRetryComplete: onComplete
  });

  // Core fetch implementation
  const fetchFeedData = useCallback(async (isBackgroundFetch = false): Promise<SocialActivity[]> => {
    if (useMockData) {
      console.log("Using mock data for social feed");
      return [];
    }
    
    // Try to reconnect if not connected
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      try {
        refreshSharedPool();
        console.log(`Auto-reconnecting to relays (current status: ${connectionStatus})`);
        await connectToRelays(undefined, true);
      } catch (reconnectError) {
        console.warn(`Reconnection attempt failed: ${reconnectError}`);
        // Continue with fetch attempt even if reconnection fails
      }
    }
    
    console.log(`Fetching ${type} feed from Nostr network with connection status: ${getConnectionStatus()}`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        feed = await fetchSocialFeed(maxItems || 20);
      } else {
        // For global feed, update timestamp
        if (type === "global" && !isBackgroundFetch) {
          updateGlobalRefreshTimestamp();
        }
        console.log(`Calling fetchGlobalSocialFeed with limit ${maxItems || 30}`);
        feed = await fetchGlobalSocialFeed(maxItems || 30);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      throw error;
    }
    
    // If no activities were returned, return empty array
    if (!feed || feed.length === 0) {
      console.log(`No activities found for ${type} feed`);
      return [];
    }
    
    // For follower feed, enrich with reaction data
    let processedFeed = feed;
    
    if (type === "followers") {
      try {
        processedFeed = await enrichActivitiesWithData(feed);
      } catch (error) {
        console.error("Error enriching activities with data:", error);
        // Continue with original feed if enrichment fails
        processedFeed = feed;
      }
    }
    
    // Apply maxItems limit if specified
    if (maxItems && processedFeed.length > maxItems) {
      processedFeed = processedFeed.slice(0, maxItems);
    }
    
    return processedFeed;
  }, [type, maxItems, useMockData]);

  // Main fetch function with error handling
  const fetchFeed = useCallback(async () => {
    // Prevent multiple concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("Skipping refresh - another refresh is already in progress");
      return;
    }
    
    // For global feed, implement a cooldown to prevent too frequent refreshes
    if (type === "global" && !canRefreshGlobalFeed()) {
      console.log(`Skipping global feed refresh due to cooldown`);
      return;
    }
    
    isRefreshingRef.current = true;
    
    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
      resetRetryCount();
    }
    
    try {
      // Save current activities to ref for comparison in background refresh
      if (isBackgroundRefresh) {
        previousActivitiesRef.current = [...activities];
      }
      
      console.log(`Starting feed data fetch, background: ${isBackgroundRefresh}`);
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
          setActivities(fetchedActivities);
        } else {
          console.log("No new items in background refresh");
        }
      } else {
        setActivities(fetchedActivities);
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error loading social feed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error loading feed";
      const newError = error instanceof Error ? error : new Error(errorMessage);
      setError(newError);
      
      if (!isBackgroundRefresh) {
        // Schedule retries for non-background refreshes
        scheduleRetry(() => fetchFeedData(false).then(fetchedActivities => {
          setActivities(fetchedActivities);
          return Promise.resolve();
        }));
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
      isRefreshingRef.current = false;
    }
  }, [
    activities, 
    fetchFeedData, 
    isBackgroundRefresh, 
    onComplete, 
    resetRetryCount, 
    scheduleRetry, 
    type
  ]);

  return {
    activities,
    loading,
    error,
    fetchFeed
  };
}
