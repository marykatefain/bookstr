
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
  onComplete?: () => void;
  isBackgroundRefresh?: boolean;
  until?: number;
}

export function useFeedCore({
  type,
  maxItems = 15,
  refreshTrigger = 0,
  onComplete,
  isBackgroundRefresh = false,
  until
}: UseFeedCoreProps) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fetchInProgress = useRef(false);
  const loggedIn = isLoggedIn();
  const isRefreshingRef = useRef(false);

  // Create a cache key based on feed type and max items
  const getCacheKey = useCallback(() => {
    return `${type}-${maxItems}${until ? `-until-${until}` : ''}`;
  }, [type, maxItems, until]);

  // Function to ensure connection to relays
  const ensureConnection = useCallback(async () => {
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      console.log(`Connection status: ${connectionStatus}, attempting to connect...`);
      return connectToRelays(undefined, false);
    }
    return Promise.resolve();
  }, []);

  // Function to set the loading state
  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  // Function to handle successful fetch
  const handleFetchSuccess = useCallback((fetchedActivities: SocialActivity[]) => {
    setActivities(fetchedActivities);
    setError(null);
    setRetryCount(0);
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Function to handle fetch error
  const handleFetchError = useCallback((err: any): Error => {
    console.error(`Error fetching ${type} feed:`, err);
    const newError = err instanceof Error ? err : new Error(String(err));
    setError(newError);
    
    // Only show toast error if not a background refresh
    if (!isBackgroundRefresh) {
      toast({
        title: "Error loading feed",
        description: "There was a problem loading the latest posts. Please try again.",
        variant: "destructive"
      });
    }
    
    // Increment retry count
    setRetryCount(prev => prev + 1);
    
    return newError;
  }, [type, isBackgroundRefresh]);

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
      setError(new Error("Login required"));
      return;
    }

    fetchInProgress.current = true;
    isRefreshingRef.current = true;
    const cacheKey = getCacheKey();
    const now = Date.now();
    const cached = feedCache[cacheKey];

    // Use cache if available and not expired (but skip for pagination requests)
    if (!until && cached && now - cached.timestamp < CACHE_TTL && !isBackgroundRefreshing) {
      console.log(`Using cached ${type} feed data`);
      setActivities(cached.activities);
      setLoading(false);
      fetchInProgress.current = false;
      isRefreshingRef.current = false;
      return;
    }

    if (!isBackgroundRefreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log(`Fetching ${type} feed...${until ? ` (pagination: until=${until})` : ''}`);
      
      // Check connection status first
      await ensureConnection();

      let results: SocialActivity[] = [];

      if (type === "followers") {
        results = await fetchSocialFeed(maxItems);
      } else {
        results = await fetchGlobalSocialFeed(maxItems, until);
      }

      console.log(`Fetched ${results.length} activities for ${type} feed`);
      
      // Update cache (skip for pagination requests)
      if (!until) {
        feedCache[cacheKey] = { activities: results, timestamp: Date.now() };
      }
      
      // Update state
      setActivities(results);
      setRetryCount(0); // Reset retry count on success
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error(`Error fetching ${type} feed:`, err);
      
      // Use cached data as fallback if available (but not for pagination)
      if (!until && cached) {
        console.log("Using cached data as fallback after error");
        setActivities(cached.activities);
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(new Error(`Failed to fetch ${type} feed: ${errorMessage}`));
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
      isRefreshingRef.current = false;
    }
  }, [type, maxItems, until, isBackgroundRefreshing, getCacheKey, loggedIn, ensureConnection, onComplete]);

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
    setIsBackgroundRefreshing,
    isRefreshingRef,
    ensureConnection,
    setLoadingState,
    handleFetchSuccess,
    handleFetchError
  };
}
