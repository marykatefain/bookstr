import { useCallback, useRef } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed 
} from "@/lib/nostr";
import { 
  enrichActivitiesWithData,
  canRefreshGlobalFeed,
  updateGlobalRefreshTimestamp
} from "@/lib/nostr/utils/feedUtils";
import { getConnectionStatus } from "@/lib/nostr/relay";

interface UseFeedDataOptions {
  type: "followers" | "global";
  maxItems?: number;
  useMockData?: boolean;
  until?: number;
}

// In-memory cache for feed data
const feedCache = new Map<string, {data: SocialActivity[], timestamp: number}>();
const FEED_CACHE_TTL = 60000; // 1 minute

export function useFeedData({
  type,
  maxItems,
  useMockData = false,
  until
}: UseFeedDataOptions) {
  // Keep a reference to the last fetched data for better UX
  const lastFetchedDataRef = useRef<SocialActivity[]>([]);
  
  // Core fetch implementation
  const fetchFeedData = useCallback(async (isBackgroundFetch = false): Promise<SocialActivity[]> => {
    if (useMockData) {
      console.log("Using mock data for social feed");
      return [];
    }
    
    // Generate cache key
    const cacheKey = `feed-${type}-${maxItems || 20}${until ? `-until-${until}` : ''}`;
    
    // For paginated requests or background fetches, skip cache check
    if (!isBackgroundFetch && !until) {
      // Check cache first (only for non-background fetches)
      const now = Date.now();
      const cached = feedCache.get(cacheKey);
      
      if (cached && (now - cached.timestamp < FEED_CACHE_TTL)) {
        console.log(`Using cached ${type} feed data, age: ${Math.floor((now - cached.timestamp)/1000)}s`);
        lastFetchedDataRef.current = cached.data;
        return cached.data;
      }
    }
    
    console.log(`Fetching ${type} feed from Nostr network with connection status: ${getConnectionStatus()}`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        // For following feed, convert milliseconds to seconds for Nostr timestamps
        const untilSeconds = until ? Math.floor(until / 1000) : undefined;
        feed = await fetchSocialFeed(maxItems || 20, untilSeconds);
      } else {
        // For global feed, update timestamp (but not for paginated requests)
        if (type === "global" && !isBackgroundFetch && !until) {
          updateGlobalRefreshTimestamp();
        }
        console.log(`Calling fetchGlobalSocialFeed with limit ${maxItems || 30}${until ? ` until ${until}` : ''}`);
        feed = await fetchGlobalSocialFeed(maxItems || 30, until);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      
      // Skip fallbacks for pagination requests
      if (until) {
        return [];
      }
      
      // If we have cached data, return it instead of throwing
      const cached = feedCache.get(cacheKey);
      if (cached) {
        console.log(`Falling back to cached ${type} feed data due to error`);
        return cached.data;
      }
      
      // Return last fetched data as fallback
      if (lastFetchedDataRef.current.length > 0) {
        console.log(`Falling back to last fetched ${type} feed data due to error`);
        return lastFetchedDataRef.current;
      }
      
      throw error;
    }
    
    // If no activities were returned but we have cache, use cache
    if ((!feed || feed.length === 0) && !isBackgroundFetch && !until) {
      const cached = feedCache.get(cacheKey);
      if (cached) {
        console.log(`Using cached ${type} feed data because new fetch returned no data`);
        return cached.data;
      }
      
      // Return last fetched data as fallback
      if (lastFetchedDataRef.current.length > 0) {
        return lastFetchedDataRef.current;
      }
      
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
    
    // Apply maxItems limit if specified (but not for paginated requests)
    if (maxItems && !until && processedFeed.length > maxItems) {
      processedFeed = processedFeed.slice(0, maxItems);
    }
    
    // Update cache and last fetched data (only for non-background fetches and non-paginated requests)
    if (!isBackgroundFetch && !until && processedFeed.length > 0) {
      feedCache.set(cacheKey, {
        data: processedFeed,
        timestamp: Date.now()
      });
      
      lastFetchedDataRef.current = processedFeed;
    }
    
    return processedFeed;
  }, [type, maxItems, useMockData, until]);
  
  // Background fetch function that doesn't update the UI
  const backgroundFetch = useCallback(async (): Promise<void> => {
    try {
      await fetchFeedData(true);
    } catch (error) {
      console.error("Background fetch error:", error);
    }
  }, [fetchFeedData]);

  // Check if we can refresh the global feed
  const canRefresh = useCallback(() => {
    return type !== "global" || until !== undefined || canRefreshGlobalFeed();
  }, [type, until]);

  return {
    fetchFeedData,
    backgroundFetch,
    canRefresh
  };
}
