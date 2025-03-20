
import { type Filter, type Event } from "nostr-tools";
import { NOSTR_KINDS } from "../../../types";
import { getUserRelays } from "../../../relay";
import { cacheQueryResult, getCachedQueryResult, generateCacheKey } from "../../../relay/connection";
import { getSharedPool } from "../../../utils/poolManager";

const MAX_REQUEST_TIME = 15000; // 15 seconds timeout

/**
 * Fetch events for the global feed with caching and timeout
 */
export async function fetchGlobalEvents(limit: number): Promise<Event[]> {
  const relays = getUserRelays();
  
  // Create combined filter instead of separate queries
  // This reduces the number of separate requests
  const combinedFilter: Filter = {
    kinds: [
      NOSTR_KINDS.BOOK_TBR,
      NOSTR_KINDS.BOOK_READING, 
      NOSTR_KINDS.BOOK_READ,
      NOSTR_KINDS.BOOK_RATING,
      NOSTR_KINDS.REVIEW,
      NOSTR_KINDS.TEXT_NOTE
    ],
    limit: limit * 2, // Increase limit as we'll filter later
    "#t": ["bookstr"]
  };
  
  // Generate cache key for this query
  const cacheKey = generateCacheKey(combinedFilter);
  
  // Check if we have a recent cached result
  const cachedEvents = getCachedQueryResult(cacheKey);
  if (cachedEvents) {
    console.log("Using cached events for global feed");
    return cachedEvents;
  }
  
  // Execute query with timeout
  const events = await fetchWithTimeout(relays, combinedFilter);
  
  // Cache the result for future use
  if (events && events.length > 0) {
    cacheQueryResult(cacheKey, events);
  }
  
  console.log(`Found ${events.length} events in global feed query`);
  
  // If query returned empty, possible connection issue
  if (events.length === 0) {
    console.warn("Query returned no events, possible connection issue");
  }
  
  return events;
}

/**
 * Fetch events with a timeout to prevent hanging requests
 */
async function fetchWithTimeout(relays: string[], filter: Filter): Promise<Event[]> {
  try {
    const pool = getSharedPool();
    
    // Create a promise that resolves with the query results or rejects after timeout
    const queryPromise = new Promise<Event[]>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      
      // Setup timeout
      timeoutId = setTimeout(() => {
        reject(new Error(`Query timed out after ${MAX_REQUEST_TIME}ms`));
      }, MAX_REQUEST_TIME);
      
      // Execute query
      pool.querySync(relays, filter)
        .then(events => {
          clearTimeout(timeoutId);
          resolve(events);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    // Wait for either query to complete or timeout
    return await queryPromise;
  } catch (error) {
    console.error(`Error fetching events:`, error);
    return []; // Return empty array on error to prevent complete failure
  }
}
