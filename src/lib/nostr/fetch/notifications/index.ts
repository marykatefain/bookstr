import { getUserRelays } from "../../relay";
import { getSharedPool } from "../../utils/poolManager";
import { fetchUserProfiles } from "../../profile";
import { shortenHash } from "@/lib/utils/hash";
import { type Event } from "nostr-tools";

/**
 * Fetches notifications for a user by looking for events that mention their pubkey in p tags
 * @param pubkey The user's pubkey
 * @returns An array of notification objects
 */
export const fetchNotifications = async (pubkey: string | undefined): Promise<any[]> => {
  if (!pubkey) {
    console.log("No pubkey provided, returning empty notifications");
    return [];
  }

  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    console.log(`Fetching notifications for ${pubkey} from ${relays.length} relays`);
    
    // Create filter for notifications - events that mention the user's pubkey
    const filter = {
      kinds: [1, 7, 1111],  // Text notes, reactions, review comments
      "#p": [pubkey],       // Events that mention the user's pubkey
      limit: 50,
      since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 // Last 7 days
    };
    
    // Use querySync instead of subscribe (which is causing the error)
    const events = await pool.querySync(relays, filter);
    console.log(`Received ${events.length} notification events`);
    
    if (!events || events.length === 0) {
      return [];
    }
    
    // Process events into notification objects
    let notifications = events.map((event: Event) => ({
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      created_at: event.created_at,
      content: event.content,
      tags: event.tags,
      link: getEventLink(event)
    }));
    
    // Get author profiles
    const authorPublicKeys = [...new Set(notifications.map(n => n.pubkey))];
    const authorProfiles = await fetchUserProfiles(authorPublicKeys);
    
    // Enrich notifications with author info
    const enrichedNotifications = notifications.map(notification => {
      const author = authorProfiles.find(p => p.pubkey === notification.pubkey);
      return {
        ...notification,
        author: author || {
          pubkey: notification.pubkey,
          name: shortenHash(notification.pubkey)
        }
      };
    });
    
    // Sort by created_at (newest first)
    enrichedNotifications.sort((a, b) => b.created_at - a.created_at);
    
    return enrichedNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

/**
 * Generates a link to the appropriate page for a notification event
 */
const getEventLink = (event: any): string => {
  // Extract the event that was reacted to
  const reactedEventId = event.kind === 7 
    ? event.tags.find((tag: string[]) => tag[0] === "e")?.[1]
    : null;
    
  // For reactions, link to the original post
  if (event.kind === 7 && reactedEventId) {
    return `/post/${reactedEventId}`;
  }
  
  // For review comments
  if (event.kind === 1111) {
    // Find the root event (should be the review)
    const rootTag = event.tags.find((tag: string[]) => tag[0] === "e" && tag.length > 2 && tag[2] === "root");
    if (rootTag && rootTag[1]) {
      return `/post/${rootTag[1]}`;
    }
  }
  
  // For replies to posts
  if (event.kind === 1) {
    // Link to the post itself
    return `/post/${event.id}`;
  }
  
  // Default: link to the post
  return `/post/${event.id}`;
};