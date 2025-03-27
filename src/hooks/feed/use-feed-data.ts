
import { useCallback } from "react";
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
}

export function useFeedData({
  type,
  maxItems,
  useMockData = false
}: UseFeedDataOptions) {
  
  // Core fetch implementation
  const fetchFeedData = useCallback(async (isBackgroundFetch = false): Promise<SocialActivity[]> => {
    if (useMockData) {
      console.log("Using mock data for social feed");
      return [];
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

  // Check if we can refresh the global feed
  const canRefresh = useCallback(() => {
    return type !== "global" || canRefreshGlobalFeed();
  }, [type]);

  return {
    fetchFeedData,
    canRefresh
  };
}
