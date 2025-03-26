
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";
import { Event } from "nostr-tools";

/**
 * Fetch a single event by its ID
 */
export async function fetchEventById(id: string): Promise<Event | null> {
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    
    console.log(`Fetching event with ID: ${id}`);
    
    const events = await pool.querySync(relayUrls, {
      ids: [id],
      limit: 1
    });
    
    if (events.length > 0) {
      return events[0];
    }
    
    console.warn(`Event with ID ${id} not found`);
    return null;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
}
