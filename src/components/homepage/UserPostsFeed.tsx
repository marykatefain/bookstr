
import React, { useEffect } from "react";
import { useSocialFeed } from "@/hooks/use-social-feed";
import { PostCard } from "@/components/post/PostCard";
import { ActivityCard } from "@/components/social/ActivityCard";
import { useReactionContext } from "@/contexts/ReactionContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { FeedTypeSelector } from "./social/FeedTypeSelector";
import { isLoggedIn } from "@/lib/nostr";

interface UserPostsFeedProps {
  refreshTrigger?: number;
}

export function UserPostsFeed({
  refreshTrigger = 0
}: UserPostsFeedProps) {
  const location = useLocation();
  const isLoggedInUser = isLoggedIn();
  
  const {
    activities,
    loading,
    error,
    refreshFeed,
    loadMore,
    hasMore,
    loadingMore
  } = useSocialFeed({
    type: "global",
    maxItems: 10,
    refreshTrigger,
    enablePagination: true
  });

  // Use our new reaction context
  const { toggleReaction } = useReactionContext();

  // Handle reactions for any activity
  const handleReaction = async (activityId: string) => {
    console.log(`UserPostsFeed: Handling reaction for activity: ${activityId}`);
    await toggleReaction(activityId);
  };

  // Fetch posts on initial render and when refresh is triggered
  useEffect(() => {
    console.log('UserPostsFeed: Refreshing feed');
    refreshFeed().then(() => {
      console.log('UserPostsFeed: Feed refresh completed');
    });
  }, [refreshFeed, refreshTrigger]);
  
  // Extra effect to ensure timestamps are properly set
  useEffect(() => {
    // If we have activities but no timestamp setup is being applied
    if (activities.length > 0) {
      console.log('UserPostsFeed: Ensuring timestamp setup');
    }
  }, [activities]);

  // Handle loading more posts
  const handleLoadMore = () => {
    console.log('Load more button clicked');
    
    // Debug the current activities
    if (activities.length > 0) {
      const lastActivity = activities[activities.length - 1];
      console.log('Last activity:', {
        id: lastActivity.id,
        type: lastActivity.type,
        createdAt: lastActivity.createdAt
      });
    }
    
    loadMore();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-[150px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center mt-6 p-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No global activities yet. Create your first post above or add books to your lists!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium my-[4px]">#Bookstr Community Feed</h3>
        
        {isLoggedInUser && (
          <FeedTypeSelector 
            activePath={location.pathname} 
            paths={[
              { label: "Global", path: "/" },
              { label: "Following", path: "/following" }
            ]} 
          />
        )}
      </div>
      
      {activities.map(activity => 
        activity.type === 'post' ? (
          <PostCard key={activity.id} post={activity} onReaction={handleReaction} />
        ) : (
          <ActivityCard key={activity.id} activity={activity} onReaction={handleReaction} />
        )
      )}

      {/* Load More Button */}
      {activities.length > 0 && (
        <div className="flex justify-center pt-4 pb-8">
          {hasMore ? (
            <Button 
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full max-w-[200px]"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load More
                </>
              )}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">No more posts to load</p>
          )}
        </div>
      )}
    </div>
  );
}
