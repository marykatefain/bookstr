
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

/**
 * Fetch replies for a specific event
 * @param eventId The ID of the event to fetch replies for
 * @returns An array of replies
 */
export async function fetchReplies(eventId: string): Promise<any[]> {
  if (!eventId) {
    console.error("Cannot fetch replies: No event ID provided");
    return [];
  }

  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    // Create a filter to find replies to this event
    const filter: Filter = {
      kinds: [NOSTR_KINDS.POST_REPLY],
      "#e": [eventId]
    };
    
    const events = await pool.querySync(relays, filter);
    
    // Process the replies
    const replies = await Promise.all(events.map(async (event) => {
      try {
        // Try to get the author's profile
        const authorProfile = await fetchUserProfile(event.pubkey);
        
        return {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          createdAt: event.created_at * 1000,
          parentId: eventId,
          author: authorProfile ? {
            name: authorProfile.name || authorProfile.display_name || "Unknown",
            picture: authorProfile.picture,
            npub: event.pubkey
          } : undefined
        };
      } catch (error) {
        console.error("Error processing reply:", error);
        return {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          createdAt: event.created_at * 1000,
          parentId: eventId
        };
      }
    }));
    
    // Sort by timestamp, newest first
    return replies.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return [];
  }
}

/**
 * Add a book to TBR list
 */
export async function addBookToTBR(book: any): Promise<string | null> {
  // Implementation (placeholder)
  console.log("Adding book to TBR:", book);
  return "event-id";
}

/**
 * Mark a book as reading
 */
export async function markBookAsReading(book: any): Promise<string | null> {
  // Implementation (placeholder)
  console.log("Marking book as reading:", book);
  return "event-id";
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: any): Promise<string | null> {
  // Implementation (placeholder)
  console.log("Marking book as read:", book);
  return "event-id";
}

/**
 * Rate a book
 */
export async function rateBook(isbn: string, rating: number): Promise<string | null> {
  // Implementation (placeholder)
  console.log(`Rating book ${isbn} with ${rating} stars`);
  return "event-id";
}

/**
 * Review a book
 */
export async function reviewBook(book: any, reviewText: string, rating?: number): Promise<string | null> {
  // Implementation (placeholder)
  console.log(`Reviewing book ${book.isbn} with text: ${reviewText}, rating: ${rating}`);
  return "event-id";
}

/**
 * Add a book to a specific list
 */
export async function addBookToList(book: any, listType: string): Promise<string | null> {
  // Implementation (placeholder)
  console.log(`Adding book ${book.isbn} to list: ${listType}`);
  return "event-id";
}

/**
 * Update a book in a specific list
 */
export async function updateBookInList(book: any, listType: string): Promise<boolean> {
  // Implementation (placeholder)
  console.log(`Updating book ${book.isbn} in list: ${listType}`);
  return true;
}

/**
 * Remove a book from a specific list
 */
export async function removeBookFromList(book: any, listType: string): Promise<boolean> {
  // Implementation (placeholder)
  console.log(`Removing book ${book.isbn} from list: ${listType}`);
  return true;
}

/**
 * Follow a user
 */
export async function followUser(pubkey: string): Promise<string | null> {
  // Implementation (placeholder)
  console.log(`Following user: ${pubkey}`);
  return "event-id";
}

/**
 * External reference to fetchUserProfile, prevent circular imports
 */
// This is just a placeholder, as we need to prevent circular imports
let fetchUserProfile: (pubkey: string) => Promise<any> = async () => null;

// Set the real fetchUserProfile function later to avoid circular dependencies
export function setFetchUserProfileFn(fn: (pubkey: string) => Promise<any>) {
  fetchUserProfile = fn;
}
