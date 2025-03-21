
import { Event } from "nostr-tools";
import { NOSTR_KINDS, Reply } from "../types";
import { publishToNostr } from "../publish";
import { getCurrentUser } from "../user";
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";
import { fetchFollowingList } from "../fetch";
import { toast } from "@/hooks/use-toast";

/**
 * Service for handling social interactions like reactions, replies, and follows
 */
export class SocialInteractionService {
  /**
   * React to content (review, rating, etc)
   */
  static async reactToContent(eventId: string): Promise<string | null> {
    const event = {
      kind: NOSTR_KINDS.REACTION,
      tags: [
        ["e", eventId]
      ],
      content: "+"
    };
    
    return publishToNostr(event);
  }
  
  /**
   * Reply to content (review, rating, etc)
   */
  static async replyToContent(eventId: string, pubkey: string, replyText: string): Promise<string | null> {
    if (!eventId || !replyText.trim()) {
      console.error("Cannot reply: missing eventId or reply text");
      return null;
    }

    // Determine if this is a reply to a post or a book-related event
    let kind = NOSTR_KINDS.BOOK_LIST_REPLY; // Default to book list reply

    try {
      // Fetch the original event to determine its kind
      const originalEvent = await this.fetchEventById(eventId);
      
      if (originalEvent) {
        // If the original event is a text note (kind 1), use kind 1 for the reply
        if (originalEvent.kind === NOSTR_KINDS.TEXT_NOTE) {
          kind = NOSTR_KINDS.POST_REPLY;
        }
      }
    } catch (error) {
      console.error("Error determining event kind for reply:", error);
      // Continue with default kind if there's an error
    }

    const event = {
      kind: kind,
      tags: [
        ["e", eventId, "", "reply"],
        ["p", pubkey]
      ],
      content: replyText
    };
    
    return publishToNostr(event);
  }
  
  /**
   * Fetch an event by its ID
   */
  static async fetchEventById(eventId: string): Promise<Event | null> {
    if (!eventId) {
      console.error("Cannot fetch event: missing eventId");
      return null;
    }
    
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    try {
      const events = await pool.querySync(relayUrls, {
        ids: [eventId],
        limit: 1
      });
      
      return events[0] || null;
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      return null;
    }
  }
  
  /**
   * Fetch reactions for a specific event
   */
  static async fetchReactions(eventId: string): Promise<{ count: number; userReacted: boolean }> {
    const relays = getUserRelays();
    const pool = getSharedPool();
    const currentUser = getCurrentUser();
    
    try {
      // Get all reaction events for this event
      const filter = {
        kinds: [NOSTR_KINDS.REACTION],
        '#e': [eventId]
      };
      
      const reactionEvents = await pool.querySync(relays, filter);
      
      // Count the reactions
      const count = reactionEvents.length;
      
      // Check if the current user has reacted
      const userReacted = currentUser ? 
        reactionEvents.some(event => event.pubkey === currentUser.pubkey) : 
        false;
      
      return { count, userReacted };
    } catch (error) {
      console.error(`Error fetching reactions for event ${eventId}:`, error);
      return { count: 0, userReacted: false };
    }
  }
  
  /**
   * Fetch replies for a specific event
   */
  static async fetchReplies(eventId: string): Promise<Reply[]> {
    if (!eventId) {
      console.error("Cannot fetch replies: missing eventId");
      return [];
    }
    
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    try {
      // Query for replies to this event (both kinds)
      const events = await pool.querySync(relayUrls, {
        kinds: [NOSTR_KINDS.BOOK_LIST_REPLY, NOSTR_KINDS.POST_REPLY],
        "#e": [eventId],
        limit: 50
      });
      
      if (!events.length) {
        return [];
      }
      
      // Format replies
      const replies: Reply[] = events.map(event => ({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000, // Convert to milliseconds
        parentId: eventId,
        author: undefined // Will be populated later
      }));
      
      // Fetch profiles for reply authors
      const authorPubkeys = Array.from(new Set(replies.map(reply => reply.pubkey)));
      const profiles = await this.fetchProfilesForPubkeys(authorPubkeys);
      
      // Attach profile data to replies
      return replies.map(reply => {
        const profile = profiles[reply.pubkey];
        
        if (profile) {
          reply.author = {
            name: profile.name,
            picture: profile.picture,
            npub: profile.npub
          };
        }
        
        return reply;
      });
    } catch (error) {
      console.error("Error fetching replies:", error);
      return [];
    }
  }
  
  /**
   * Fetch profiles for a list of pubkeys
   */
  static async fetchProfilesForPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    if (!pubkeys.length) return {};
    
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    try {
      const events = await pool.querySync(relayUrls, {
        kinds: [NOSTR_KINDS.SET_METADATA],
        authors: pubkeys
      });
      
      const profiles: Record<string, any> = {};
      
      for (const event of events) {
        try {
          const profileData = JSON.parse(event.content);
          profiles[event.pubkey] = {
            name: profileData.name || profileData.display_name,
            picture: profileData.picture,
            npub: event.pubkey
          };
        } catch (error) {
          console.error("Error parsing profile data:", error);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return {};
    }
  }
  
  /**
   * Follow a user
   */
  static async followUser(pubkey: string): Promise<string | null> {
    if (!pubkey) {
      console.error("Cannot follow user: pubkey is missing");
      return null;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }
    
    console.log(`===== Following user ${pubkey} =====`);
    
    try {
      // First, fetch the user's existing follow list
      const { follows } = await fetchFollowingList(currentUser.pubkey);
      console.log("Current follows:", follows);
      
      // Check if already following
      if (follows.includes(pubkey)) {
        console.log(`Already following ${pubkey}`);
        return null;
      }
      
      // If the follows list is empty, warn the user that this might be their first follow
      const isFirstFollow = follows.length === 0;
      
      // Create a new set to avoid duplicates
      const updatedFollows = new Set([...follows, pubkey]);
      console.log("Updated follows:", Array.from(updatedFollows));
      
      // Convert to the format needed for tags
      const followTags = Array.from(updatedFollows).map(key => ["p", key]);
      
      // Create the event with all follows included
      const event = {
        kind: NOSTR_KINDS.CONTACTS,
        tags: followTags,
        content: ""
      };
      
      if (isFirstFollow) {
        toast({
          title: "This may be your first follow",
          description: "If you already follow others but they're not appearing, please ensure your follow list is synced to the relays.",
          variant: "warning",
          duration: 5000
        });
      }
      
      console.log("Publishing follow event with tags:", followTags);
      return publishToNostr(event);
    } catch (error) {
      console.error("Error in followUser:", error);
      toast({
        title: "Error following user",
        description: "Could not update your follow list. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }
}
