import { SocialActivity } from "../../../types";
import { fetchGlobalEvents } from "./fetchEvents";
import { processFeedEvents } from "./feedProcessor";

/**
 * Fetch global social feed (no author filter)
 * @param limit Number of items to fetch
 * @param until Optional timestamp to fetch events before (for pagination)
 * @returns Promise resolving to array of social activities
 */
export async function fetchGlobalSocialFeed(limit = 20, until?: number): Promise<SocialActivity[]> {
  try {
    console.log(`Fetching global social feed with limit ${limit}${until ? ` until ${until}` : ''}`);
    
    // Step 1: Fetch events from relays
    const events = await fetchGlobalEvents(limit * 2, until); // Fetch more to allow for filtering
    console.log(`Received ${events.length} events from relays for global feed`);
    
    if (!events || events.length === 0) {
      console.log("No events received from relays");
      return [];
    }
    
    // Step 2: Process events into social activities
    const activities = await processFeedEvents(events, limit);
    console.log(`Processed ${activities.length} social activities for global feed`);
    
    return activities;
  } catch (error) {
    console.error("Error fetching global social feed:", error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
}
