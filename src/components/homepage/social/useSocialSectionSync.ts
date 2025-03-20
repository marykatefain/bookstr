
import { useRef, useEffect } from "react";
import { debounce } from "@/lib/utils";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";
import { connectToRelays } from "@/lib/nostr/relay";

export function useSocialSectionSync(refreshFeed: () => void) {
  const autoRefreshTimerRef = useRef<number | null>(null);
  const lastManualRefreshRef = useRef<number>(0);
  
  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useRef(
    debounce(() => {
      console.log("Triggering debounced refresh");
      refreshFeed();
    }, 1000)
  ).current;
  
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
  }, [debouncedRefresh]);

  // Initial feed load effect
  useEffect(() => {
    console.log("SocialSection mounted, triggering initial feed refresh");
    refreshFeed();
  }, [refreshFeed]);
  
  return {
    autoRefreshTimerRef,
    lastManualRefreshRef,
    debouncedRefresh
  };
}
