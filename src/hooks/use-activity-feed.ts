
import { useState, useEffect, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { getSharedPool } from "@/lib/nostr/utils/poolManager";
import { getUserRelays } from "@/lib/nostr/relay";
import { NOSTR_KINDS } from "@/lib/nostr/types/constants";
import { processFeedEvents } from "@/lib/nostr/fetch/social/global/feedProcessor";

interface UseActivityFeedParams {
  page: number;
  itemsPerPage: number;
}

interface UseActivityFeedResult {
  activities: SocialActivity[];
  loading: boolean;
  error: Error | null;
  refreshFeed: () => Promise<void>;
  totalPages: number;
}

export function useActivityFeed({
  page = 1,
  itemsPerPage = 20
}: UseActivityFeedParams): UseActivityFeedResult {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [allActivities, setAllActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivityEvents = useCallback(async () => {
    const relays = getUserRelays();
    
    if (!relays || relays.length === 0) {
      throw new Error("No relays available for fetching activity");
    }
    
    const pool = getSharedPool();
    
    // Create filter for query - specifically for book activities
    const filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING, 
        NOSTR_KINDS.BOOK_READ
      ],
      limit: 100 // Fetch more to have data for pagination
    };
    
    try {
      console.log(`Querying ${relays.length} relays for activity feed events...`);
      const events = await pool.querySync(relays, filter);
      console.log(`Received ${events.length} events for activity feed`);
      return events;
    } catch (error) {
      console.error("Error fetching activity events:", error);
      throw error;
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const events = await fetchActivityEvents();
      if (!events || events.length === 0) {
        setAllActivities([]);
        setActivities([]);
        setTotalPages(1);
        return;
      }
      
      // Process events into activities
      const processedActivities = await processFeedEvents(events, 100); // Added second parameter for limit
      
      // Sort by created time descending (newest first)
      const sortedActivities = processedActivities.sort(
        (a, b) => b.createdAt - a.createdAt
      );
      
      // Calculate total pages
      const total = Math.ceil(sortedActivities.length / itemsPerPage);
      setTotalPages(total || 1);
      
      // Store all activities for pagination
      setAllActivities(sortedActivities);
      
      // Get current page slice
      const startIndex = (page - 1) * itemsPerPage;
      const pageActivities = sortedActivities.slice(startIndex, startIndex + itemsPerPage);
      setActivities(pageActivities);
      
    } catch (err) {
      console.error("Error loading activity feed:", err);
      setError(err instanceof Error ? err : new Error("Failed to load activity feed"));
    } finally {
      setLoading(false);
    }
  }, [fetchActivityEvents, page, itemsPerPage]);

  // Initial fetch and when page changes
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed, page]);

  // When page changes, update current activities from already fetched data
  useEffect(() => {
    if (allActivities.length > 0) {
      const startIndex = (page - 1) * itemsPerPage;
      const pageActivities = allActivities.slice(startIndex, startIndex + itemsPerPage);
      setActivities(pageActivities);
    }
  }, [page, itemsPerPage, allActivities]);

  return {
    activities,
    loading,
    error,
    refreshFeed: fetchFeed,
    totalPages
  };
}
