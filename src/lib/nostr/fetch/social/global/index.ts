
import { SocialActivity } from "../../../types";
import { fetchGlobalEvents } from "./fetchEvents";
import { processFeedEvents } from "./feedProcessor";

/**
 * Fetch global social feed (no author filter)
 */
export async function fetchGlobalSocialFeed(limit = 20): Promise<SocialActivity[]> {
  try {
    console.log("Fetching global social feed");
    
    // Step 1: Fetch events from relays
    const events = await fetchGlobalEvents(limit);
    
    // Step 2: Process events into social activities
    return processFeedEvents(events, limit);
  } catch (error) {
    console.error("Error fetching global social feed:", error);
    throw error; // Rethrow to allow proper error handling upstream
  }
}
