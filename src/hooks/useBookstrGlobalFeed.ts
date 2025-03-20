
import { useState, useEffect, useRef, useCallback } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { getSharedPool } from "@/lib/nostr/utils/poolManager";
import { getUserRelays, connectToRelays, getConnectionStatus } from "@/lib/nostr/relay";
import { NOSTR_KINDS } from "@/lib/nostr/types/constants";
import { fetchUserProfiles } from "@/lib/nostr";
import { transformEventsToActivities } from "@/lib/nostr/utils/eventTransformer";

// Cache for storing fetched events
const eventCache = new Map<string, {data: SocialActivity[], timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const FETCH_LIMIT = 20;

export function useBookstrGlobalFeed() {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastFetchRef = useRef(Date.now());
  
  // Check if cache is valid
  const getCachedEvents = useCallback(() => {
    const cachedData = eventCache.get('global-feed');
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('Using cached events:', cachedData.data.length);
      return cachedData.data;
    }
    return null;
  }, []);
  
  // Save events to cache
  const setCachedEvents = useCallback((data: SocialActivity[]) => {
    eventCache.set('global-feed', {
      data,
      timestamp: Date.now()
    });
  }, []);
  
  // Main fetch function
  const fetchEvents = useCallback(async () => {
    // Check for recent cache first
    const cachedEvents = getCachedEvents();
    if (cachedEvents) {
      setActivities(cachedEvents);
      setLoading(false);
      return cachedEvents;
    }
    
    // Set a cooldown to avoid too frequent fetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (!isInitialLoadRef.current && timeSinceLastFetch < 10000) {
      console.log(`Skipping fetch, too soon (${timeSinceLastFetch}ms since last fetch)`);
      return activities;
    }
    
    lastFetchRef.current = now;
    
    try {
      // Ensure we have relay connections
      const connectionStatus = getConnectionStatus();
      if (connectionStatus !== 'connected') {
        await connectToRelays();
      }
      
      const relays = getUserRelays();
      const pool = getSharedPool();
      
      console.log('Fetching book list events (kinds 10073-10075) for global feed...');
      
      // Create filter for just the book list events
      const filter = { 
        kinds: [
          NOSTR_KINDS.BOOK_TBR,     // 10073
          NOSTR_KINDS.BOOK_READING, // 10074
          NOSTR_KINDS.BOOK_READ     // 10075
        ], 
        limit: FETCH_LIMIT 
      };
      
      // Fetch events with simplified filter
      const events = await pool.querySync(relays, filter)
        .catch(err => {
          console.error('Error fetching events:', err);
          return [];
        });
      
      console.log(`Fetched ${events.length} book list events`);
      
      // Get unique authors
      const authorPubkeys = [...new Set(events.map(event => event.pubkey))];
      
      // Fetch author profiles
      const profilesArray = await fetchUserProfiles(authorPubkeys);
      console.log(`Fetched ${profilesArray.length} profiles`);
      
      // Convert the profiles array to a Record/object with pubkey as key
      const profilesRecord: Record<string, { name?: string; picture?: string; npub?: string }> = {};
      profilesArray.forEach(profile => {
        if (profile && profile.pubkey) {
          profilesRecord[profile.pubkey] = {
            name: profile.name || profile.display_name,
            picture: profile.picture,
            npub: profile.npub
          };
        }
      });
      
      // Transform events to activities
      const result = await transformEventsToActivities(events, profilesRecord);
      
      // Sort by recent first
      result.sort((a, b) => b.createdAt - a.createdAt);
      
      // Limit to requested amount
      const limitedResult = result.slice(0, FETCH_LIMIT);
      
      // Save to cache
      setCachedEvents(limitedResult);
      
      // Update state
      setActivities(limitedResult);
      setError(null);
      
      return limitedResult;
    } catch (e) {
      console.error('Error fetching global feed:', e);
      setError(e instanceof Error ? e : new Error('Failed to fetch feed'));
      return activities;
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [activities, getCachedEvents, setCachedEvents]);
  
  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  return {
    activities,
    loading,
    error,
    refreshFeed: fetchEvents
  };
}
