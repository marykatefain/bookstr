
import { useRef, useEffect, useCallback } from "react";
import { debounce } from "@/lib/utils";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";
import { connectToRelays } from "@/lib/nostr/relay";

export function useSocialSectionSync(refreshFeed: () => void, backgroundRefresh?: () => void) {
  const autoRefreshTimerRef = useRef<number | null>(null);
  const lastManualRefreshRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(Date.now());
  
  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useRef(
    debounce(() => {
      console.log("Triggering debounced refresh");
      refreshFeed();
    }, 1000)
  ).current;
  
  // Function to perform background refresh without UI updates
  const performBackgroundRefresh = useCallback(() => {
    if (backgroundRefresh) {
      console.log("Performing background refresh");
      backgroundRefresh();
    }
  }, [backgroundRefresh]);
  
  // Force connect on component mount to ensure we're always connected
  useEffect(() => {
    const ensureConnection = async () => {
      try {
        console.log("Initial connection to relays on component mount");
        refreshSharedPool();
        await connectToRelays(undefined, true);
        console.log("Initial connection successful, refreshing feed");
        // Trigger initial feed refresh after connection
        debouncedRefresh();
      } catch (error) {
        console.error("Failed to connect on component mount:", error);
      }
    };
    
    ensureConnection();
    
    // Set up background refresh timer - every 30 seconds
    if (backgroundRefresh) {
      const timer = setInterval(() => {
        // Only start background refreshes after component has been mounted for at least 10 seconds
        if (Date.now() - mountTimeRef.current > 10000) {
          performBackgroundRefresh();
        }
      }, 30000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [debouncedRefresh, performBackgroundRefresh]);

  // Initial feed load effect
  useEffect(() => {
    console.log("SocialSection mounted, triggering initial feed refresh");
    refreshFeed();
  }, [refreshFeed]);
  
  return {
    autoRefreshTimerRef,
    lastManualRefreshRef,
    debouncedRefresh,
    performBackgroundRefresh
  };
}
