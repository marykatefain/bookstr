
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
