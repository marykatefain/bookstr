
import { useEffect } from "react";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";

interface UseAutoRefreshProps {
  feedType: "followers" | "global";
  autoRefreshTimerRef: React.MutableRefObject<number | null>;
  refreshFeed: () => void;
  setIsBackgroundRefreshing: (value: boolean) => void;
}

export function useAutoRefresh({
  feedType,
  autoRefreshTimerRef,
  refreshFeed,
  setIsBackgroundRefreshing
}: UseAutoRefreshProps) {
  // Auto-refresh logic for global feed
  useEffect(() => {
    // Clear any existing timer when feed type changes or component unmounts
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    // Only set up auto-refresh for global feed and use a longer interval
    if (feedType === "global") {
      console.log("Setting up auto-refresh for global feed");
      // Refresh every 2 minutes
      autoRefreshTimerRef.current = window.setInterval(() => {
        // Only refresh if we have an active connection
        const connectionStatus = getConnectionStatus();
        if (connectionStatus === 'connected') {
          console.log("Auto-refreshing global feed");
          setIsBackgroundRefreshing(true);
          refreshFeed();
        } else {
          console.log("Skipping auto-refresh due to connection issues:", connectionStatus);
          // Try to reconnect when we detect a connection issue
          connectToRelays(undefined, false).catch(err => 
            console.error("Error reconnecting during auto-refresh:", err)
          );
        }
      }, 120000); // 2 minutes
    }

    // Cleanup on unmount
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [feedType, autoRefreshTimerRef, refreshFeed, setIsBackgroundRefreshing]);
}
