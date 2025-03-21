
import { useState, useEffect, useCallback, useRef } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchSocialFeed, fetchGlobalSocialFeed } from "@/lib/nostr/fetch";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";
import { isLoggedIn } from "@/lib/nostr";
import { toast } from "@/components/ui/use-toast";

// Cache for feed data to reduce refetches
const feedCache: Record<string, { activities: SocialActivity[], timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseFeedCoreProps {
  type: "followers" | "global";
  maxItems?: number;
  refreshTrigger?: number;
}

export function useFeedCore({
  type,
  maxItems = 15,
  refreshTrigger = 0,
}: UseFeedCoreProps) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fetchInProgress = useRef(false);
  const loggedIn = isLoggedIn();

  // Create a cache key based on feed type and max items
  const getCacheKey = useCallback(() => {
    return `${type}-${maxItems}`;
  }, [type, maxItems]);

  // Function to fetch the feed with error handling and caching
  const fetchFeed = useCallback(async () => {
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    // Check if user is logged in for followers feed
    if (type === "followers" && !loggedIn) {
      console.log("User not logged in, cannot fetch followers feed");
      setLoading(false);
      setError("Login required");
      return;
    }

    fetchInProgress.current = true;
    const cacheKey = getCacheKey();
    const now = Date.now();
    const cached = feedCache[cacheKey];

    // Use cache if available and not expired
    if (cached && now - cached.timestamp < CACHE_TTL && !isBackgroundRefreshing) {
      console.log(`Using cached ${type} feed data`);
      setActivities(cached.activities);
      setLoading(false);
      fetchInProgress.current = false;
      return;
    }

    if (!isBackgroundRefreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log(`Fetching ${type} feed...`);
      
      // Check connection status first
      const connectionStatus = getConnectionStatus();
      if (connectionStatus !== 'connected') {
        console.log(`Connection status: ${connectionStatus}, attempting to connect...`);
        await connectToRelays(undefined, false);
      }

      let results: SocialActivity[] = [];

      if (type === "followers") {
        results = await fetchSocialFeed(maxItems);
      } else {
        results = await fetchGlobalSocialFeed(maxItems);
      }

      console.log(`Fetched ${results.length} activities for ${type} feed`);
      
      // Update cache
      feedCache[cacheKey] = { activities: results, timestamp: Date.now() };
      
      // Update state
      setActivities(results);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error(`Error fetching ${type} feed:`, err);
      
      // Use cached data as fallback if available
      if (cached) {
        console.log("Using cached data as fallback after error");
        setActivities(cached.activities);
      } else {
        setError(`Failed to fetch ${type} feed. Please try again.`);
      }
      
      // Only show toast error if not a background refresh
      if (!isBackgroundRefreshing) {
        toast({
          title: "Error loading feed",
          description: "There was a problem loading the latest posts. Please try again.",
          variant: "destructive"
        });
      }
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
      setIsBackgroundRefreshing(false);
      fetchInProgress.current = false;
    }
  }, [type, maxItems, isBackgroundRefreshing, getCacheKey, loggedIn]);

  // Function to manually refresh the feed
  const refreshFeed = useCallback(() => {
    console.log(`Manually refreshing ${type} feed`);
    fetchFeed();
  }, [fetchFeed, type]);

  // Fetch on mount and when refresh is triggered
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed, refreshTrigger]);

  // Auto-retry on error, with increasing backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const backoffTime = Math.min(1000 * 2 ** retryCount, 10000);
      console.log(`Retrying feed fetch in ${backoffTime}ms (attempt ${retryCount + 1})`);
      
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying feed fetch (attempt ${retryCount + 1})`);
        fetchFeed();
      }, backoffTime);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, fetchFeed]);

  return {
    activities,
    loading,
    error,
    refreshFeed,
    isBackgroundRefreshing,
    setIsBackgroundRefreshing
  };
}
