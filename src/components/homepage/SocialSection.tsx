
import React, { useState, useEffect, useRef } from "react";
import { Users, Globe, RefreshCw } from "lucide-react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { Card } from "@/components/ui/card";
import { SocialFeed } from "@/components/SocialFeed";
import { Button } from "@/components/ui/button";
import { getConnectionStatus, connectToRelays } from "@/lib/nostr/relay";

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
    
    // Check connection status and reconnect if needed
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      try {
        await connectToRelays(undefined, true); // Force reconnect
      } catch (error) {
        console.error("Failed to reconnect:", error);
      }
    }
    
    refreshFeed();
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
      // Refresh every 2 minutes instead of 30 seconds
      autoRefreshTimerRef.current = window.setInterval(() => {
        // Only refresh if we have an active connection
        const connectionStatus = getConnectionStatus();
        if (connectionStatus === 'connected') {
          console.log("Auto-refreshing global feed");
          setIsBackgroundRefreshing(true);
          refreshFeed();
        } else {
          console.log("Skipping auto-refresh due to connection issues:", connectionStatus);
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
