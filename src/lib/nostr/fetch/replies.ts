
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";
import { fetchUserProfiles } from "../profile";
import { NOSTR_KINDS } from "../types";
import { Reply } from "../types";

/**
 * Fetch replies for a specific event
 * Finds events that reference the target event with an 'e' tag
 */
export async function fetchReplies(eventId: string): Promise<Reply[]> {
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    
    console.log(`Fetching replies for event: ${eventId}`);
    
    // Query for text notes (kind 1) that reference this event
    const events = await pool.querySync(relayUrls, {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      "#e": [eventId],
      limit: 50
    });
    
    console.log(`Found ${events.length} replies for event ${eventId}`);
    
    if (events.length === 0) {
      return [];
    }
    
    // Get unique pubkeys from events
    const pubkeys = [...new Set(events.map(event => event.pubkey))];
    
    // Fetch user profiles for authors
    const profiles = await fetchUserProfiles(pubkeys);
    
    // Map events to Reply objects
    const replies: Reply[] = events.map(event => {
      const profile = profiles.find(p => p.pubkey === event.pubkey);
      
      return {
        id: event.id,
        content: event.content,
        pubkey: event.pubkey,
        createdAt: event.created_at * 1000,
        author: profile ? {
          name: profile.name || profile.display_name,
          picture: profile.picture,
          npub: profile.npub
        } : undefined
      };
    });
    
    // Sort replies by creation time (newest first)
    return replies.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error(`Error fetching replies for event ${eventId}:`, error);
    return [];
  }
}

/**
 * Batch fetch replies for multiple events
 * Returns a map of event IDs to arrays of replies
 */
export async function batchFetchReplies(eventIds: string[]): Promise<Record<string, Reply[]>> {
  if (!eventIds.length) {
    return {};
  }
  
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    
    console.log(`Batch fetching replies for ${eventIds.length} events`);
    
    // Create chunks of event IDs to avoid too large filter
    const chunkSize = 10;
    const eventIdChunks = [];
    for (let i = 0; i < eventIds.length; i += chunkSize) {
      eventIdChunks.push(eventIds.slice(i, i + chunkSize));
    }
    
    // Initialize result map
    const repliesMap: Record<string, Reply[]> = {};
    for (const eventId of eventIds) {
      repliesMap[eventId] = [];
    }
    
    // Process chunks sequentially
    for (const chunk of eventIdChunks) {
      // Create a filter that will match any reply for any of the event IDs in this chunk
      const events = await pool.querySync(relayUrls, {
        kinds: [NOSTR_KINDS.TEXT_NOTE],
        "#e": chunk
      });
      
      if (events.length === 0) {
        continue;
      }
      
      // Get unique pubkeys from events
      const pubkeys = [...new Set(events.map(event => event.pubkey))];
      
      // Fetch user profiles for authors
      const profiles = await fetchUserProfiles(pubkeys);
      
      // Process the events
      for (const event of events) {
        // Find which event this reply is for
        const eTag = event.tags.find(tag => tag[0] === 'e');
        if (eTag && eTag[1]) {
          const targetEventId = eTag[1];
          
          // Skip if this event ID is not in our list
          if (!repliesMap[targetEventId]) {
            continue;
          }
          
          const profile = profiles.find(p => p.pubkey === event.pubkey);
          
          // Add to the replies for this event
          repliesMap[targetEventId].push({
            id: event.id,
            content: event.content,
            pubkey: event.pubkey,
            createdAt: event.created_at * 1000,
            author: profile ? {
              name: profile.name || profile.display_name,
              picture: profile.picture,
              npub: profile.npub
            } : undefined
          });
        }
      }
    }
    
    // Sort replies by creation time (newest first)
    for (const eventId in repliesMap) {
      repliesMap[eventId].sort((a, b) => b.createdAt - a.createdAt);
    }
    
    return repliesMap;
  } catch (error) {
    console.error("Error batch fetching replies:", error);
    // Return empty results
    const emptyResults: Record<string, Reply[]> = {};
    for (const eventId of eventIds) {
      emptyResults[eventId] = [];
    }
    return emptyResults;
  }
}
