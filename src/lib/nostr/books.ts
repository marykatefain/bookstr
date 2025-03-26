import {
  publishToNostr,
  fetchEventById,
  getUserRelays,
  getSharedPool,
  isLoggedIn,
  getCurrentUser
} from ".";
import { NOSTR_KINDS } from "./types";
import { Filter } from "nostr-tools";

/**
 * React to a Nostr event (like)
 * @param eventId The ID of the event to react to
 * @returns The ID of the reaction event if successful
 */
export async function reactToContent(eventId: string): Promise<string | null> {
  if (!eventId) {
    console.error("Cannot react to content: No event ID provided");
    return null;
  }

  try {
    // Get the original event to find its author
    const event = await fetchEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Create a reaction event
    const reactionEvent = {
      kind: NOSTR_KINDS.REACTION,
      content: "+", // "+" for like reaction
      tags: [
        ["e", eventId], // The event we're reacting to
        ["p", event.pubkey] // The author of the event
      ]
    };

    // Publish the reaction
    const reactionId = await publishToNostr(reactionEvent);
    return reactionId;
  } catch (error) {
    console.error("Error reacting to content:", error);
    throw error;
  }
}

/**
 * Reply to a Nostr event
 * @param eventId The ID of the event to reply to
 * @param authorPubkey The pubkey of the author of the original event
 * @param content The content of the reply
 * @returns The ID of the reply event if successful
 */
export async function replyToContent(
  eventId: string,
  authorPubkey: string,
  content: string
): Promise<string | null> {
  if (!eventId || !authorPubkey || !content.trim()) {
    console.error("Cannot reply to content: Missing required parameters");
    return null;
  }

  try {
    // Create a reply event
    const replyEvent = {
      kind: NOSTR_KINDS.POST_REPLY,
      content,
      tags: [
        ["e", eventId], // The event we're replying to
        ["p", authorPubkey] // The author of the original event
      ]
    };

    // Publish the reply
    const replyId = await publishToNostr(replyEvent);
    return replyId;
  } catch (error) {
    console.error("Error replying to content:", error);
    throw error;
  }
}

/**
 * Fetch reactions for a specific event
 * @param eventId The ID of the event to fetch reactions for
 * @returns An object containing the count of reactions and whether the current user has reacted
 */
export async function fetchReactions(eventId: string): Promise<{ count: number; userReacted: boolean }> {
  if (!eventId) {
    console.error("Cannot fetch reactions: No event ID provided");
    return { count: 0, userReacted: false };
  }

  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    // Create a filter to find reactions to this event
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REACTION],
      "#e": [eventId]
    };
    
    const events = await pool.querySync(relays, filter);
    const reactionCount = events.length;
    
    // Check if the current user has reacted
    let userReacted = false;
    
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      userReacted = events.some(event => 
        event.pubkey === currentUser?.pubkey && 
        event.content === "+"
      );
    }
    
    return {
      count: reactionCount,
      userReacted
    };
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return { count: 0, userReacted: false };
  }
}
