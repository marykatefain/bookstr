
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";
import { getCurrentUser, isLoggedIn } from "../user";
import { NOSTR_KINDS } from "../types";

/**
 * Fetch reactions for a specific event
 * Returns a count of reactions and whether the current user has reacted
 */
export async function fetchReactions(eventId: string): Promise<{ count: number; userReacted: boolean }> {
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    
    console.log(`Fetching reactions for event: ${eventId}`);
    
    // Query for all reaction events (kind 7) that reference this event
    const events = await pool.querySync(relayUrls, {
      kinds: [NOSTR_KINDS.REACTION],
      "#e": [eventId],
      limit: 100
    });
    
    console.log(`Found ${events.length} reactions for event ${eventId}`);
    
    // Check if the current user has reacted
    let userReacted = false;
    const currentUser = isLoggedIn() ? getCurrentUser() : null;
    
    if (currentUser) {
      userReacted = events.some(event => event.pubkey === currentUser.pubkey);
    }
    
    return {
      count: events.length,
      userReacted
    };
  } catch (error) {
    console.error(`Error fetching reactions for event ${eventId}:`, error);
    return {
      count: 0,
      userReacted: false
    };
  }
}

/**
 * Batch fetch reactions for multiple events
 * Returns a map of event IDs to reaction data
 */
export async function batchFetchReactions(eventIds: string[]): Promise<Record<string, { count: number; userReacted: boolean }>> {
  if (!eventIds.length) {
    return {};
  }
  
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    const currentUser = isLoggedIn() ? getCurrentUser() : null;
    
    console.log(`Batch fetching reactions for ${eventIds.length} events`);
    
    // Create chunks of event IDs to avoid too large filter
    const chunkSize = 10;
    const eventIdChunks = [];
    for (let i = 0; i < eventIds.length; i += chunkSize) {
      eventIdChunks.push(eventIds.slice(i, i + chunkSize));
    }
    
    // Process each chunk
    const reactionsMap: Record<string, { count: number; userReacted: boolean }> = {};
    
    // Initialize result map with zeros
    for (const eventId of eventIds) {
      reactionsMap[eventId] = { count: 0, userReacted: false };
    }
    
    // Process chunks sequentially to avoid overwhelming relays
    for (const chunk of eventIdChunks) {
      // Create a filter that will match any reaction event for any of the event IDs in this chunk
      const events = await pool.querySync(relayUrls, {
        kinds: [NOSTR_KINDS.REACTION],
        "#e": chunk
      });
      
      // Process the events
      for (const event of events) {
        // Find which event this reaction is for
        const eTag = event.tags.find(tag => tag[0] === 'e');
        if (eTag && eTag[1]) {
          const targetEventId = eTag[1];
          
          // Increment the count for this event
          if (reactionsMap[targetEventId]) {
            reactionsMap[targetEventId].count++;
            
            // Check if current user has reacted
            if (currentUser && event.pubkey === currentUser.pubkey) {
              reactionsMap[targetEventId].userReacted = true;
            }
          }
        }
      }
    }
    
    return reactionsMap;
  } catch (error) {
    console.error("Error batch fetching reactions:", error);
    // Return empty results
    const emptyResults: Record<string, { count: number; userReacted: boolean }> = {};
    for (const eventId of eventIds) {
      emptyResults[eventId] = { count: 0, userReacted: false };
    }
    return emptyResults;
  }
}
