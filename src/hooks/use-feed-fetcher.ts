
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
import { getConnectionStatus } from "@/lib/nostr/relay";

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
    
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      console.warn(`Cannot fetch feed: Connection status is ${connectionStatus}`);
      throw new Error(`Nostr connection not established (${connectionStatus})`);
    }
    
    console.log(`Fetching ${type} feed from Nostr network`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        feed = await fetchSocialFeed(maxItems || 20);
      } else {
        // For global feed, check cooldown and update timestamp
        if (type === "global" && !isBackgroundFetch) {
          updateGlobalRefreshTimestamp();
        }
        feed = await fetchGlobalSocialFeed(maxItems || 30);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      throw error;
    }
    
    // If no activities were returned, that's not necessarily an error
    // It could be that there are no activities matching our criteria
    if (!feed || feed.length === 0) {
      console.log(`No activities found for ${type} feed`);
      return [];
    }
    
    // For global feed, we already have reactions and replies data from the optimized fetch
    // So only fetch additional data for follower feed
    let processedFeed = feed;
    
    if (type === "followers") {
      // Batch fetch reactions and replies for efficiency
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
      
      const fetchedActivities = await fetchFeedData(isBackgroundRefresh);
      
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
