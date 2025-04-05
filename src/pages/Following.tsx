import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { FeedHeader } from "@/components/homepage/social/FeedHeader";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { isLoggedIn } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getFeedRefreshInterval } from "@/lib/nostr/utils/feedUtils";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FeedTypeSelector } from "@/components/homepage/social/FeedTypeSelector";

export default function Following() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedType] = useState<"followers" | "global">("followers");
  const intervalIdRef = useRef<number | null>(null);
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Clear any existing intervals when component mounts
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Set up automatic refresh interval
  useEffect(() => {
    // Only set up interval if we're actively viewing the feed
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Get refresh interval based on feed type
    const interval = getFeedRefreshInterval();
    
    console.log(`Setting up auto-refresh for ${feedType} feed, interval: ${interval}ms`);
    
    // Setup interval
    intervalIdRef.current = window.setInterval(() => {
      console.log("Auto-refresh triggered");
      setRefreshTrigger(prev => prev + 1);
    }, interval);
    
    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [feedType]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    console.log("Manual refresh triggered");
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Handle refresh completion
  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-6 py-6 pb-10 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold">Following Feed</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <FeedHeader showFeedTypeSelector={isDesktop}>
            {isDesktop && (
              <FeedTypeSelector 
                activePath={location.pathname} 
                paths={[
                  { label: "Global", path: "/" },
                  { label: "Following", path: "/following" }
                ]} 
              />
            )}
          </FeedHeader>
        </div>
        
        {isLoggedIn() && (
          <div className="mb-2">
            <CreatePostBox />
            <Separator className="mt-6" />
          </div>
        )}

        <SocialFeed 
          type="followers" 
          refreshTrigger={refreshTrigger}
          onRefreshComplete={handleRefreshComplete}
          enablePagination={true}
          maxItems={10}
        />
      </div>
    </Layout>
  );
}