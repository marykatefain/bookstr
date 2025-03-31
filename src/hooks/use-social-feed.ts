import { useState, useEffect, useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { useFeedFetcher } from "./use-feed-fetcher";
import { useToast } from "@/components/ui/use-toast";

interface UseSocialFeedParams {
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  providedActivities?: SocialActivity[];
  isBackgroundRefresh?: boolean;
  onRefreshComplete?: () => void;
  until?: number;
  enablePagination?: boolean;
}

interface UseSocialFeedResult {
  activities: SocialActivity[];
  loading: boolean;
  backgroundLoading: boolean;
  error: Error | null;
  refreshFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

export function useSocialFeed({
  type = "followers",
  useMockData = false,
  maxItems,
  refreshTrigger = 0,
  providedActivities,
  isBackgroundRefresh = false,
  onRefreshComplete,
  until,
  enablePagination = false
}: UseSocialFeedParams): UseSocialFeedResult {
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allActivities, setAllActivities] = useState<SocialActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const initialLoadCompleted = useRef(false);
  const activitiesRef = useRef<SocialActivity[]>([]);
  const lastTimestamp = useRef<number | undefined>(undefined);
  const timestampSyncedRef = useRef<boolean>(false);  // Track if timestamp is synced
  const { toast } = useToast();
  
  // Use the core feed fetcher for the current page
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
    onComplete: onRefreshComplete,
    until
  });

  // Update all activities when new ones arrive
  useEffect(() => {
    if (fetchedActivities && fetchedActivities.length > 0) {
      // Print detailed info for debugging
      console.log("Activities received:", fetchedActivities.length);
      
      // Print details of the last item
      const lastItem = fetchedActivities[fetchedActivities.length - 1];
      console.log("Last item details:", {
        id: lastItem.id,
        type: lastItem.type,
        createdAt: lastItem.createdAt,
        hasCreatedAt: !!lastItem.createdAt
      });
      
      if (until) {
        // This is a pagination load - append to existing activities
        setAllActivities(prev => {
          const combined = [...prev, ...fetchedActivities];
          // Remove duplicates
          return combined.filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          );
        });
        
        // If we got fewer items than requested, we've reached the end
        setHasMore(fetchedActivities.length >= (maxItems || 10));
        
        // Update loading state
        setLoadingMore(false);
      } else {
        // Initial load - replace all activities
        setAllActivities(fetchedActivities);
        
        // Reset pagination state
        setHasMore(true);
        
        // Update refs
        activitiesRef.current = fetchedActivities;
        initialLoadCompleted.current = true;
        
        // Set the lastTimestamp for pagination on initial load
        if (enablePagination && fetchedActivities.length > 0) {
          const lastActivity = fetchedActivities[fetchedActivities.length - 1];
          
          // Extra debugging
          console.log("Last activity from initial load:", lastActivity);
          console.log("Last activity has createdAt:", !!lastActivity.createdAt, 
            " value:", lastActivity.createdAt);
          
          if (lastActivity && lastActivity.createdAt) {
            console.log(`Setting initial lastTimestamp to ${lastActivity.createdAt}`);
            lastTimestamp.current = lastActivity.createdAt;
            timestampSyncedRef.current = true;
            
            // DEBUG: Verify the timestamp was set
            console.log("Timestamp set, current value:", lastTimestamp.current);
          } else {
            console.warn('Initial activities missing createdAt timestamp');
          }
        }
      }
    } else if (fetchedActivities && fetchedActivities.length === 0 && until) {
      // No more results
      setHasMore(false);
      setLoadingMore(false);
    } else if (fetchedActivities && fetchedActivities.length === 0 && !until) {
      // Initial load with no results
      setAllActivities([]);
      setHasMore(false);
      initialLoadCompleted.current = true;
    }
  }, [fetchedActivities, until, maxItems, enablePagination]);

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
      setAllActivities(providedActivities);
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
  const refreshFeed2 = useCallback(async () => {
    console.log("Manual refresh triggered from useSocialFeed");
    return fetchFeed();
  }, [fetchFeed]);

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    console.log(`loadMore called with: enablePagination=${enablePagination}, lastTimestamp=${lastTimestamp.current}, loadingMore=${loadingMore}, loading=${loading}, hasMore=${hasMore}`);
    
    if (!enablePagination) {
      console.log('Pagination not enabled');
      return;
    }
    
    // If no timestamp is saved but we have activities, use the timestamp from the last activity
    let timestamp = lastTimestamp.current;
    if (!timestamp && allActivities.length > 0) {
      const lastAct = allActivities[allActivities.length - 1];
      if (lastAct.createdAt) {
        console.log(`No saved timestamp found, using timestamp from last activity: ${lastAct.createdAt}`);
        timestamp = lastAct.createdAt;
      }
    }
    
    if (!timestamp) {
      console.log('No last timestamp available or derivable from activities');
      return;
    }
    
    if (loadingMore) {
      console.log('Already loading more');
      return;
    }
    
    if (loading) {
      console.log('Initial loading in progress');
      return;
    }
    
    if (!hasMore) {
      console.log('No more data to load');
      return;
    }
    
    console.log(`Loading more activities, timestamp: ${timestamp}`);
    setLoadingMore(true);
    
    try {
      // Use the fetchGlobalSocialFeed function directly for pagination
      const fetchMoreActivities = async () => {
        // Import directly from the source to avoid module resolution issues
        const { fetchGlobalSocialFeed } = await import('@/lib/nostr/fetch/social/global');
        
        // Calculate the timestamp in seconds (Nostr uses seconds, not milliseconds)
        // The createdAt property is already in milliseconds, so we divide by 1000
        const timestampInSeconds = Math.floor(timestamp / 1000);
        
        console.log(`Fetching activities before timestamp (seconds): ${timestampInSeconds}`);
        return fetchGlobalSocialFeed(maxItems || 10, timestampInSeconds);
      };
      
      // Fetch the paginated data
      const moreActivities = await fetchMoreActivities();
      console.log(`Loaded ${moreActivities.length} more activities`);
      
      // Update the state with the new activities
      if (moreActivities.length > 0) {
        setAllActivities(prev => {
          const combined = [...prev, ...moreActivities];
          // Remove duplicates
          return combined.filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          );
        });
        
        // Update the timestamp for the next pagination
        const lastActivity = moreActivities[moreActivities.length - 1];
        if (lastActivity) {
          // createdAt is in milliseconds
          if (lastActivity.createdAt) {
            console.log(`Updating lastTimestamp from ${timestamp} to ${lastActivity.createdAt}`);
            lastTimestamp.current = lastActivity.createdAt;
            timestampSyncedRef.current = true;
          } else {
            console.warn('Last activity has no createdAt timestamp', lastActivity);
          }
        }
        
        // If we got fewer items than requested, we've reached the end
        setHasMore(moreActivities.length >= (maxItems || 10));
      } else {
        // No more results
        console.log('No more activities returned');
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more activities:", error);
      toast?.({
        title: "Error loading more posts",
        description: "Failed to load additional posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  }, [type, maxItems, useMockData, loadingMore, loading, hasMore, enablePagination]);

  // Effect to keep timestamp synced with activities
  useEffect(() => {
    // If we have activities and enablePagination is on but timestamp isn't set or synced
    if (enablePagination && 
        allActivities.length > 0 && 
        (!lastTimestamp.current || !timestampSyncedRef.current)) {
      // Find the latest activity
      let lastAct = allActivities[allActivities.length - 1];
      
      if (lastAct && lastAct.createdAt) {
        console.log(`SYNC: Setting lastTimestamp to ${lastAct.createdAt} from latest activity`);
        lastTimestamp.current = lastAct.createdAt;
        timestampSyncedRef.current = true;
      }
    }
  }, [allActivities, enablePagination]);

  // Final activities to return: either all activities (for pagination) or currently fetched activities
  const finalActivities = enablePagination ? allActivities : 
    (providedActivities || fetchedActivities);

  // Debug current timestamp state on each render for debugging
  if (enablePagination) {
    console.log(`[useSocialFeed render] lastTimestamp=${lastTimestamp.current}, activities=${finalActivities.length}, hasMore=${hasMore}`);
  }

  return {
    activities: finalActivities,
    loading: loading && !initialLoadCompleted.current, // Only show loading on initial load
    backgroundLoading,
    error,
    refreshFeed: refreshFeed2,
    loadMore,
    hasMore,
    loadingMore
  };
}
