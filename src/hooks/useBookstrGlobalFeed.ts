
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
  
  // Process events into activities - can be called with partial results
  const processEvents = useCallback(async (events: any[]) => {
    if (!events || events.length === 0) return [];
    
    try {
      // Extract pubkeys for profile fetching
      const pubkeys = [...new Set(events.map(event => event.pubkey))];
      
      // Fetch profiles in the background
      const profiles = await fetchUserProfiles(pubkeys);
      
      // Convert to a record for the transformer
      const profilesRecord: Record<string, { name?: string; picture?: string; npub?: string }> = {};
      profiles.forEach(profile => {
        if (profile && profile.pubkey) {
          profilesRecord[profile.pubkey] = {
            name: profile.name || profile.display_name,
            picture: profile.picture,
            npub: profile.npub
          };
        }
      });
      
      // Transform events to activities
      const processedActivities = await transformEventsToActivities(events, profilesRecord);
      return processedActivities;
    } catch (error) {
      console.error('Error processing events:', error);
      return [];
    }
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
    
    // Cancel any in-progress fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      // Ensure we have relay connections
      const connectionStatus = getConnectionStatus();
      if (connectionStatus !== 'connected') {
        await connectToRelays();
      }
      
      const relays = getUserRelays();
      const pool = getSharedPool();
      
      if (!pool) {
        throw new Error('Failed to get pool for fetching events');
      }
      
      setLoading(true);
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
      
      // Set up event collection
      let collectedEvents: any[] = [];
      let hasUpdates = false;
      let firstBatchProcessed = false;
      
      // Process events incrementally as they arrive
      const processIncrementally = async (events: any[]) => {
        // If this is our first batch or we have a significant number of new events, process them
        if (!firstBatchProcessed || events.length - collectedEvents.length >= 5) {
          const processedActivities = await processEvents(events);
          
          // Sort by recent first and update state
          processedActivities.sort((a, b) => b.createdAt - a.createdAt);
          
          setActivities(prev => {
            // Only update if we have new data
            if (processedActivities.length > 0) {
              hasUpdates = true;
              return processedActivities;
            }
            return prev;
          });
          
          firstBatchProcessed = true;
          collectedEvents = events;
        }
      };
      
      // Start the incremental processing with a minimum delay for UI
      const minDisplayTime = 800; // ms
      const startTime = Date.now();
      
      // Set up a timeout to collect events that have arrived so far after a short delay
      const initialProcessing = new Promise<void>(resolve => {
        setTimeout(async () => {
          if (collectedEvents.length > 0) {
            await processIncrementally(collectedEvents);
          }
          resolve();
        }, minDisplayTime);
      });
      
      // Fixing the subscription method to use the correct API
      // The SimplePool in nostr-tools uses sub() not subscribe()
      const sub = pool.sub(relays, [filter]);
      
      sub.on('event', (event) => {
        if (!collectedEvents.some(e => e.id === event.id)) {
          collectedEvents.push(event);
        }
      });
      
      // Wait for initial processing to complete
      await initialProcessing;
      
      // Wait a bit longer for more events to arrive
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Final processing of all events we've received
      if (collectedEvents.length > 0) {
        await processIncrementally(collectedEvents);
        
        // Cache the final result
        if (hasUpdates) {
          setCachedEvents(activities);
        }
      }
      
      // Clean up subscription
      sub.unsub();
      
      setError(null);
      return activities;
    } catch (e) {
      console.error('Error fetching global feed:', e);
      setError(e instanceof Error ? e : new Error('Failed to fetch feed'));
      return activities;
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
      abortControllerRef.current = null;
    }
  }, [activities, getCachedEvents, setCachedEvents, processEvents]);
  
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
