
import { useCallback, useState } from "react";
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
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to manually refresh the feed with loading indicator
  const handleManualRefresh = useCallback(async () => {
    // Prevent multiple rapid refreshes
    const now = Date.now();
    if (now - lastManualRefreshRef.current < 5000) { // 5 second cooldown
      console.log("Manual refresh cooldown active, ignoring request");
      return;
    }
    
    // Prevent multiple connection attempts
    if (isConnecting) {
      console.log("Already connecting, ignoring duplicate request");
      return;
    }
    
    lastManualRefreshRef.current = now;
    setManualRefreshing(true);
    
    // Always try to reconnect on manual refresh - this is critical for reliability
    try {
      setIsConnecting(true);
      console.log("Reconnecting to relays during manual refresh...");
      toast({
        title: "Connecting to Nostr",
        description: "Establishing connection to relays..."
      });
      
      // Refresh the shared pool to force new connections
      refreshSharedPool();
      
      // Set a timeout to ensure we don't wait forever
      const connectPromise = connectToRelays(undefined, true);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      toast({
        title: "Connected",
        description: "Successfully connected to Nostr relays"
      });
    } catch (error) {
      console.error("Failed to reconnect:", error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to all relays. Trying to fetch data anyway...",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
    
    // Refresh the feed regardless of connection status
    console.log("Triggering manual feed refresh");
    setRefreshTrigger(prev => prev + 1);
    
    // Ensure the refreshing state is removed after a timeout
    setTimeout(() => {
      setManualRefreshing(false);
    }, 3000);
  }, [lastManualRefreshRef, setManualRefreshing, setRefreshTrigger, toast, isConnecting]);

  return { handleManualRefresh, isConnecting };
}
