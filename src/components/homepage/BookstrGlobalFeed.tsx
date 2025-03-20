
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
    // Show loading state only if we have no activities at all
    if (loading && reactiveActivities.length === 0) {
      return <FeedLoadingState />;
    }
    
    // If we have an error but also some activities, show the activities first
    if (error && reactiveActivities.length === 0) {
      return <FeedErrorState error={error} onRetry={refreshFeed} />;
    }
    
    // Show empty state only if we have definitively no activities (not loading)
    if (reactiveActivities.length === 0 && !loading) {
      return (
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-muted-foreground">No posts found. Check back later or follow more people.</p>
        </div>
      );
    }
    
    // Always show activities if we have any, even during loading
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
      
      {/* Show loading indicator above content when refreshing but we already have content */}
      {loading && reactiveActivities.length > 0 && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 text-center">
          <span className="text-sm text-blue-800 dark:text-blue-400 flex items-center justify-center">
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Loading more activities...
          </span>
        </div>
      )}
      
      {memoizedContent}
    </div>
  );
}
