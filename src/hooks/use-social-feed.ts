
import { useState, useEffect, useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed,
  fetchReplies,
  fetchReactions
} from "@/lib/nostr";
import { toast } from "@/hooks/use-toast";

// Track the last global refresh timestamp
let lastGlobalRefreshTime = 0;
const GLOBAL_REFRESH_COOLDOWN = 20000; // 20 seconds between global refreshes

interface UseSocialFeedParams {
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  providedActivities?: SocialActivity[];
  isBackgroundRefresh?: boolean;
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
  isBackgroundRefresh = false
}: UseSocialFeedParams): UseSocialFeedResult {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousActivitiesRef = useRef<SocialActivity[]>([]);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // Add reference to prevent multiple concurrent refreshes
  const isRefreshingRef = useRef(false);

  // Clear any retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  const loadFeed = useCallback(async (retry = false) => {
    // Prevent multiple concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("Skipping refresh - another refresh is already in progress");
      return;
    }
    
    // For global feed, implement a cooldown to prevent too frequent refreshes
    const now = Date.now();
    if (type === "global" && !retry && now - lastGlobalRefreshTime < GLOBAL_REFRESH_COOLDOWN) {
      console.log(`Skipping global feed refresh due to cooldown (${Math.round((GLOBAL_REFRESH_COOLDOWN - (now - lastGlobalRefreshTime)) / 1000)}s remaining)`);
      return;
    }
    
    if (!retry) {
      setLoading(true);
      setError(null);
      retryCountRef.current = 0;
      isRefreshingRef.current = true;
      
      if (type === "global") {
        lastGlobalRefreshTime = now;
      }
    }
    
    try {
      await fetchFeedData();
    } catch (error) {
      console.error("Error loading social feed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error loading feed";
      setError(error instanceof Error ? error : new Error(errorMessage));
      
      // Only show toast and retry if this isn't already a retry and it's not a background refresh
      if (!retry && !isBackgroundRefresh && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        console.log(`Retrying feed load attempt ${retryCountRef.current}/${MAX_RETRIES}...`);
        
        // Retry with exponential backoff
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          loadFeed(true);
        }, 2000 * Math.pow(2, retryCountRef.current - 1)); // 2s, 4s, 8s
      } else if (!isBackgroundRefresh && retryCountRef.current >= MAX_RETRIES) {
        // Only show error toast after all retries failed and not in background mode
        toast({
          title: "Feed loading issue",
          description: "We're having trouble loading the latest posts. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      if (!retry || retryCountRef.current >= MAX_RETRIES) {
        setLoading(false);
        isRefreshingRef.current = false;
      }
    }
  }, [isBackgroundRefresh, type]);

  const loadFeedInBackground = async () => {
    if (backgroundLoading || isRefreshingRef.current) return;
    
    // For global feed, implement a cooldown for background refreshes too
    const now = Date.now();
    if (type === "global" && now - lastGlobalRefreshTime < GLOBAL_REFRESH_COOLDOWN) {
      console.log(`Skipping background global feed refresh due to cooldown (${Math.round((GLOBAL_REFRESH_COOLDOWN - (now - lastGlobalRefreshTime)) / 1000)}s remaining)`);
      return;
    }
    
    setBackgroundLoading(true);
    isRefreshingRef.current = true;
    
    if (type === "global") {
      lastGlobalRefreshTime = now;
    }
    
    try {
      // Save current activities to ref for comparison
      previousActivitiesRef.current = [...activities];
      await fetchFeedData(true);
    } catch (error) {
      console.error("Error during background refresh:", error);
      // Don't show error messages for background failures
    } finally {
      setBackgroundLoading(false);
      isRefreshingRef.current = false;
    }
  };

  const fetchFeedData = async (isBackground = false) => {
    if (useMockData) {
      // Mock data scenario - empty array for now
      console.log("Using mock data for social feed");
      
      if (!isBackground) {
        setTimeout(() => {
          setActivities([]);
        }, 800);
      }
      return;
    }
    
    // Fetch real activities from the network
    console.log(`Fetching ${type} feed from Nostr network`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        feed = await fetchSocialFeed(maxItems || 20);
      } else {
        feed = await fetchGlobalSocialFeed(maxItems || 30);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      throw error;
    }
    
    // If no activities were returned, set an empty array
    if (!feed || feed.length === 0) {
      if (!isBackground) {
        setActivities([]);
      }
      return;
    }
    
    // For global feed, we already have reactions and replies data from the optimized fetch
    // So only fetch additional data for follower feed
    let processedFeed = feed;
    
    if (type === "followers") {
      // Batch fetch reactions and replies for efficiency
      processedFeed = await enrichActivitiesWithData(feed);
    }
    
    // Apply maxItems limit if specified
    if (maxItems && processedFeed.length > maxItems) {
      processedFeed = processedFeed.slice(0, maxItems);
    }
    
    if (isBackground) {
      // Compare with previous feed to see if there are new items
      const newItemsExist = processedFeed.some(
        newActivity => !previousActivitiesRef.current.some(
          oldActivity => oldActivity.id === newActivity.id
        )
      );
      
      if (newItemsExist) {
        console.log("New feed items detected during background refresh");
        setActivities(processedFeed);
      } else {
        console.log("No new items in background refresh");
      }
    } else {
      setActivities(processedFeed);
    }
  };
  
  // Helper function to batch fetch reactions and replies
  const enrichActivitiesWithData = async (activities: SocialActivity[]): Promise<SocialActivity[]> => {
    // Get all activity IDs first
    const activityIds = activities.map(activity => activity.id);
    
    // Batch fetching in groups of 5 to avoid too many parallel requests
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < activityIds.length; i += batchSize) {
      batches.push(activityIds.slice(i, i + batchSize));
    }
    
    // Process each batch sequentially
    const enrichedActivities = [...activities];
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (activityId) => {
          try {
            const [replies, reactions] = await Promise.all([
              fetchReplies(activityId),
              fetchReactions(activityId)
            ]);
            
            // Find the activity in our array and enrich it
            const activityIndex = enrichedActivities.findIndex(a => a.id === activityId);
            if (activityIndex !== -1) {
              enrichedActivities[activityIndex] = {
                ...enrichedActivities[activityIndex],
                replies,
                reactions
              };
            }
          } catch (error) {
            console.error(`Error fetching data for activity ${activityId}:`, error);
            // Continue with other activities
          }
        })
      );
    }
    
    return enrichedActivities;
  };

  useEffect(() => {
    console.log(`useSocialFeed: ${type} feed, useMockData: ${useMockData}`, { 
      refreshTrigger, 
      maxItems,
      isBackgroundRefresh
    });

    if (providedActivities) {
      console.log("useSocialFeed: Using provided activities", providedActivities.length);
      setActivities(providedActivities);
      setLoading(false);
      return;
    }

    if (isBackgroundRefresh && activities.length > 0) {
      loadFeedInBackground();
    } else {
      loadFeed();
    }
  }, [refreshTrigger, type, providedActivities, useMockData, maxItems, loadFeed, isBackgroundRefresh, activities.length]);

  return {
    activities,
    loading,
    backgroundLoading,
    error,
    refreshFeed: () => loadFeed(false)
  };
}
