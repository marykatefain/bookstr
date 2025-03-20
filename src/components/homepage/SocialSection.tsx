import React, { useState, useEffect, useRef } from "react";
import { Users, Globe, RefreshCw } from "lucide-react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { Card } from "@/components/ui/card";
import { SocialFeed } from "@/components/SocialFeed";
import { Button } from "@/components/ui/button";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";
import { refreshSharedPool } from "@/lib/nostr/utils/poolManager";
import { useToast } from "@/hooks/use-toast";

// Debounce helper function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export function SocialSection() {
  const [feedType, setFeedType] = useState<"followers" | "global">("global");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const autoRefreshTimerRef = useRef<number | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const lastManualRefreshRef = useRef<number>(0);
  const { toast } = useToast();
  
  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useRef(
    debounce(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000)
  ).current;
  
  // This function will be passed to the CreatePostBox to trigger feed refresh
  const refreshFeed = () => {
    debouncedRefresh();
  };

  // Force connect on component mount to ensure we're always connected
  useEffect(() => {
    const ensureConnection = async () => {
      try {
        console.log("Initial connection to relays on component mount");
        refreshSharedPool();
        await connectToRelays(undefined, true);
      } catch (error) {
        console.error("Failed to connect on component mount:", error);
      }
    };
    
    ensureConnection();
  }, []);

  // Function to manually refresh the feed with loading indicator
  const handleManualRefresh = async () => {
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
    refreshFeed();
    
    // Ensure the refreshing state is removed after a timeout
    setTimeout(() => {
      setManualRefreshing(false);
    }, 3000);
  };

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
  }, [feedType]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
          <Users className="mr-2 h-5 w-5" />
          #Bookstr Community on Nostr
        </h2>
        
        <div className="flex items-center gap-2">
          {isLoggedIn() && (
            <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setFeedType("followers")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  feedType === "followers" 
                    ? "bg-background text-foreground shadow-sm" 
                    : ""
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                <span>Following</span>
              </button>
              <button
                onClick={() => setFeedType("global")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  feedType === "global" 
                    ? "bg-background text-foreground shadow-sm" 
                    : ""
                }`}
              >
                <Globe className="h-4 w-4 mr-2" />
                <span>Global</span>
              </button>
            </div>
          )}
          
          <Button
            size="icon"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={manualRefreshing || isBackgroundRefreshing}
            className="flex-shrink-0"
            title="Refresh feed"
          >
            <RefreshCw className={`h-4 w-4 ${manualRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        {isLoggedIn() ? (
          <CreatePostBox onPostSuccess={refreshFeed} />
        ) : (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Connect with other readers</h3>
            <p className="text-muted-foreground mb-4">
              Sign in to share your own reading journey and interact with other book lovers.
            </p>
            <Button 
              variant="default" 
              className="bg-bookverse-accent hover:bg-bookverse-accent/90 text-white"
              asChild
            >
              <a href="/library">Sign In</a>
            </Button>
          </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <SocialFeed 
          type={feedType} 
          useMockData={false} 
          refreshTrigger={refreshTrigger} 
          isBackgroundRefresh={isBackgroundRefreshing}
          onRefreshComplete={() => {
            setIsBackgroundRefreshing(false);
            setManualRefreshing(false);
          }}
        />
      </div>
    </div>
  );
}
