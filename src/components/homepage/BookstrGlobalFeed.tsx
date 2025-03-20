
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { FeedContent } from "@/components/social/FeedContent";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";
import { FeedErrorState } from "@/components/social/FeedErrorState";
import { useFeedReactions } from "@/hooks/use-feed-reactions";
import { useBookstrGlobalFeed } from "@/hooks/useBookstrGlobalFeed";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function BookstrGlobalFeed() {
  const { activities, loading, error, refreshFeed } = useBookstrGlobalFeed();
  const { activities: reactiveActivities, handleReact } = useFeedReactions(activities);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simple manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshFeed().finally(() => {
      setIsRefreshing(false);
    });
  }, [refreshFeed]);
  
  // Memoize the content to prevent re-renders
  const memoizedContent = useMemo(() => {
    if (loading && reactiveActivities.length === 0) {
      return <FeedLoadingState />;
    }
    
    if (error && reactiveActivities.length === 0) {
      return <FeedErrorState error={error} onRetry={refreshFeed} />;
    }
    
    if (reactiveActivities.length === 0) {
      return (
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-muted-foreground">No posts found. Check back later or follow more people.</p>
        </div>
      );
    }
    
    return (
      <FeedContent 
        activities={reactiveActivities} 
        onReaction={handleReact}
      />
    );
  }, [reactiveActivities, loading, error, refreshFeed, handleReact]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-bookverse-ink">Global Feed</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {memoizedContent}
    </div>
  );
}
