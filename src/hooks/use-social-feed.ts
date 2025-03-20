
import { useState, useEffect, useRef } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { 
  fetchSocialFeed, 
  fetchGlobalSocialFeed,
  fetchReplies,
  fetchReactions
} from "@/lib/nostr";

interface UseSocialFeedParams {
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  providedActivities?: SocialActivity[];
  isBackgroundRefresh?: boolean;
}

interface UseSocialFeedResult {
  activities: SocialActivity[];
  loading: boolean;
  backgroundLoading: boolean;
  error: Error | null;
  refreshFeed: () => Promise<void>;
}

export function useSocialFeed({
  type = "followers",
  useMockData = false,
  maxItems,
  refreshTrigger = 0,
  providedActivities,
  isBackgroundRefresh = false
}: UseSocialFeedParams): UseSocialFeedResult {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousActivitiesRef = useRef<SocialActivity[]>([]);

  useEffect(() => {
    console.log(`useSocialFeed: ${type} feed, useMockData: ${useMockData}`, { 
      refreshTrigger, 
      maxItems,
      isBackgroundRefresh
    });

    if (providedActivities) {
      console.log("useSocialFeed: Using provided activities", providedActivities.length);
      setActivities(providedActivities);
      setLoading(false);
      return;
    }

    if (isBackgroundRefresh && activities.length > 0) {
      loadFeedInBackground();
    } else {
      loadFeed();
    }
  }, [refreshTrigger, type, providedActivities, useMockData, maxItems]);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchFeedData();
    } catch (error) {
      console.error("Error loading social feed:", error);
      setError(error instanceof Error ? error : new Error("Unknown error loading feed"));
    } finally {
      setLoading(false);
    }
  };

  const loadFeedInBackground = async () => {
    if (backgroundLoading) return;
    
    setBackgroundLoading(true);
    try {
      // Save current activities to ref for comparison
      previousActivitiesRef.current = [...activities];
      await fetchFeedData(true);
    } catch (error) {
      console.error("Error during background refresh:", error);
    } finally {
      setBackgroundLoading(false);
    }
  };

  const fetchFeedData = async (isBackground = false) => {
    if (useMockData) {
      // Mock data scenario - empty array for now
      console.log("Using mock data for social feed");
      
      if (!isBackground) {
        setTimeout(() => {
          setActivities([]);
        }, 800);
      }
      return;
    }
    
    // Fetch real activities from the network
    console.log(`Fetching ${type} feed from Nostr network`);
    
    let feed: SocialActivity[] = [];
    
    try {
      if (type === "followers") {
        feed = await fetchSocialFeed(maxItems || 20);
      } else {
        feed = await fetchGlobalSocialFeed(maxItems || 30);
      }
      
      console.log(`Received ${feed.length} activities from Nostr network for ${type} feed`);
    } catch (error) {
      console.error(`Error fetching ${type} feed:`, error);
      throw error;
    }
    
    // If no activities were returned, set an empty array
    if (!feed || feed.length === 0) {
      if (!isBackground) {
        setActivities([]);
      }
      return;
    }
    
    // Fetch replies and reactions for each activity
    const activitiesWithData = await Promise.all(
      feed.map(async (activity) => {
        try {
          const [replies, reactions] = await Promise.all([
            fetchReplies(activity.id),
            fetchReactions(activity.id)
          ]);
          
          return {
            ...activity,
            replies,
            reactions: reactions
          };
        } catch (error) {
          console.error(`Error fetching data for activity ${activity.id}:`, error);
          return activity;
        }
      })
    );
    
    // Apply maxItems limit if specified
    let processedFeed = activitiesWithData;
    if (maxItems && processedFeed.length > maxItems) {
      processedFeed = processedFeed.slice(0, maxItems);
    }
    
    if (isBackground) {
      // Compare with previous feed to see if there are new items
      const newItemsExist = processedFeed.some(
        newActivity => !previousActivitiesRef.current.some(
          oldActivity => oldActivity.id === newActivity.id
        )
      );
      
      if (newItemsExist) {
        console.log("New feed items detected during background refresh");
        setActivities(processedFeed);
      } else {
        console.log("No new items in background refresh");
      }
    } else {
      setActivities(processedFeed);
    }
  };

  return {
    activities,
    loading,
    backgroundLoading,
    error,
    refreshFeed: loadFeed
  };
}
