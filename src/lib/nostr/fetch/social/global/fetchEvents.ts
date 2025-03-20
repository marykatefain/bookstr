
import { type Filter, type Event } from "nostr-tools";
import { NOSTR_KINDS } from "../../../types";
import { getUserRelays } from "../../../relay";
import { cacheQueryResult, getCachedQueryResult, generateCacheKey } from "../../../relay/connection";
import { getSharedPool } from "../../../utils/poolManager";

const MAX_REQUEST_TIME = 15000; // 15 seconds timeout

/**
 * Fetch events for the global feed with caching and timeout
 * Limited to book list update events only (kinds 10073, 10074, 10075)
 */
export async function fetchGlobalEvents(limit: number): Promise<Event[]> {
  const relays = getUserRelays();
  
  // Make sure we have relays to query
  if (!relays || relays.length === 0) {
    console.warn("No relays available for fetching global events");
    return [];
  }
  
  // Create filter for query - SIMPLIFIED to only book list events
  const combinedFilter: Filter = {
    kinds: [
      NOSTR_KINDS.BOOK_TBR,     // 10073
      NOSTR_KINDS.BOOK_READING, // 10074
      NOSTR_KINDS.BOOK_READ     // 10075
    ],
    limit: limit
  };
  
  // Generate cache key for this query
  const cacheKey = generateCacheKey(combinedFilter);
  
  // Check if we have a recent cached result
  const cachedEvents = getCachedQueryResult(cacheKey);
  if (cachedEvents) {
    console.log("Using cached events for global feed, count:", cachedEvents.length);
    return cachedEvents;
  }
  
  // Execute query with timeout
  try {
    console.log(`Querying ${relays.length} relays for book list events (kinds 10073-10075)...`);
    
    // Get the pool for querying
    const pool = getSharedPool();
    if (!pool) {
      console.error("Failed to get shared pool for event fetching");
      return [];
    }
    
    // Set up a timeout to collect events that have arrived so far
    let collectedEvents: Event[] = [];
    
    // Start the query
    const eventsPromise = pool.querySync(relays, combinedFilter);
    
    // Cache and return events as they arrive
    const timeoutPromise = new Promise<Event[]>((resolve) => {
      setTimeout(() => {
        // Cache whatever we've collected so far
        if (collectedEvents.length > 0) {
          cacheQueryResult(cacheKey, collectedEvents);
          console.log(`Cached ${collectedEvents.length} partial events for future use`);
        }
        resolve(collectedEvents);
      }, MAX_REQUEST_TIME);
    });
    
    // Race between the full query and the timeout
    const events = await Promise.race([
      eventsPromise.then(events => {
        collectedEvents = events; // Update collected events
        return events;
      }),
      timeoutPromise
    ]);
    
    console.log(`Received ${events.length} book list events from relays`);
    
    // Cache the result for future use (if not already cached by timeout)
    if (events && events.length > 0 && events !== collectedEvents) {
      cacheQueryResult(cacheKey, events);
      console.log(`Cached ${events.length} complete events for future use`);
    }
    
    return events || [];
  } catch (error) {
    console.error("Error fetching global events:", error);
    // Return empty array to allow graceful fallback
    return [];
  }
}
