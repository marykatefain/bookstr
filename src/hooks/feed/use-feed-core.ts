
import { useState, useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";

interface UseFeedCoreOptions {
  onComplete?: () => void;
  isBackgroundRefresh?: boolean;
}

export function useFeedCore({ 
  onComplete, 
  isBackgroundRefresh = false 
}: UseFeedCoreOptions = {}) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isRefreshingRef = useRef(false);
  
  // Helper function to ensure connection to relays
  const ensureConnection = useCallback(async () => {
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      try {
        refreshSharedPool();
        console.log(`Auto-reconnecting to relays (current status: ${connectionStatus})`);
        await connectToRelays(undefined, true);
        return true;
      } catch (reconnectError) {
        console.warn(`Reconnection attempt failed: ${reconnectError}`);
        return false;
      }
    }
    return true;
  }, []);
  
  // Helper to set loading state only for non-background refreshes
  const setLoadingState = useCallback((isLoading: boolean) => {
    if (!isBackgroundRefresh) {
      setLoading(isLoading);
    }
  }, [isBackgroundRefresh]);
  
  // Helper to handle successful fetch
  const handleFetchSuccess = useCallback((fetchedActivities: SocialActivity[]) => {
    setActivities(fetchedActivities);
    setError(null);
    
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);
  
  // Helper to handle fetch errors
  const handleFetchError = useCallback((fetchError: unknown) => {
    console.error("Error loading social feed:", fetchError);
    const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown error loading feed";
    const newError = fetchError instanceof Error ? fetchError : new Error(errorMessage);
    setError(newError);
    return newError;
  }, []);
  
  return {
    activities,
    setActivities,
    loading,
    error,
    setError,
    isRefreshingRef,
    ensureConnection,
    setLoadingState,
    handleFetchSuccess,
    handleFetchError
  };
}
