import { type Event, type Filter } from "nostr-tools";
import { getUserRelays } from "../../relay";
import { getSharedPool } from "../../utils/poolManager";

/**
 * Fetch a specific nostr event by its ID
 */
export async function fetchEventById(eventId: string): Promise<Event | null> {
  if (!eventId) {
    console.error("Cannot fetch event: No event ID provided");
    return null;
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    console.log(`Fetching event by ID: ${eventId}`);
    
    const filter: Filter = {
      ids: [eventId]
    };
    
    const events = await pool.querySync(relays, filter);
    
    if (events.length === 0) {
      console.log(`No event found with ID: ${eventId}`);
      return null;
    }
    
    return events[0];
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}

/**
 * Fetch reactions for a specific event
 */
export async function fetchReactions(eventId: string): Promise<{count: number, userReacted: boolean}> {
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    const currentUser = getCurrentUser();
    
    // Query for reactions to this event
    const filter = {
      kinds: [NOSTR_KINDS.REACTION],
      "#e": [eventId],
      limit: 50
    };
    
    console.log(`Fetching reactions for event ${eventId} from relays:`, relays);
    const events = await pool.querySync(relays, filter);
    
    // Count reactions (filter out duplicates by pubkey)
    const uniquePubkeys = new Set();
    events.forEach(event => {
      if (event.content === "+" || event.content === "❤️" || event.content === "👍") {
        uniquePubkeys.add(event.pubkey);
      }
    });
    
    // Check if the current user has reacted
    const userReacted = currentUser 
      ? uniquePubkeys.has(currentUser.pubkey) 
      : false;
    
    console.log(`Found ${uniquePubkeys.size} unique reactions for event ${eventId}`);
    return {
      count: uniquePubkeys.size,
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
