
import { useCallback } from "react";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";
import { connectToRelays } from "@/lib/nostr/relay";
import { useToast } from "@/hooks/use-toast";

interface UseManualRefreshProps {
  lastManualRefreshRef: React.MutableRefObject<number>;
  setManualRefreshing: (value: boolean) => void;
  setRefreshTrigger: (callback: (prev: number) => number) => void;
}

export function useManualRefresh({ 
  lastManualRefreshRef,
  setManualRefreshing,
  setRefreshTrigger
}: UseManualRefreshProps) {
  const { toast } = useToast();

  // Function to manually refresh the feed with loading indicator
  const handleManualRefresh = useCallback(async () => {
    // Prevent multiple rapid refreshes
    const now = Date.now();
    if (now - lastManualRefreshRef.current < 5000) { // 5 second cooldown
      console.log("Manual refresh cooldown active, ignoring request");
      return;
    }
    
    lastManualRefreshRef.current = now;
    setManualRefreshing(true);
    
    // Always try to reconnect on manual refresh - this is critical for reliability
    try {
      console.log("Reconnecting to relays during manual refresh...");
      toast({
        title: "Connecting to Nostr",
        description: "Establishing connection to relays..."
      });
      
      // Refresh the shared pool to force new connections
      refreshSharedPool();
      await connectToRelays(undefined, true); // Force reconnect
      
      toast({
        title: "Connected",
        description: "Successfully connected to Nostr relays"
      });
    } catch (error) {
      console.error("Failed to reconnect:", error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to relays. Please try again later.",
        variant: "destructive"
      });
    }
    
    // Refresh the feed regardless of connection status
    console.log("Triggering manual feed refresh");
    setRefreshTrigger(prev => prev + 1);
    
    // Ensure the refreshing state is removed after a timeout
    setTimeout(() => {
      setManualRefreshing(false);
    }, 3000);
  }, [lastManualRefreshRef, setManualRefreshing, setRefreshTrigger, toast]);

  return { handleManualRefresh };
}
