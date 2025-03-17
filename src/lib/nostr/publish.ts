
import { toast } from "@/hooks/use-toast";
import { SimplePool, validateEvent, getEventHash, type Event, type UnsignedEvent } from "nostr-tools";
import { NostrEventData, NOSTR_KINDS } from "./types";
import { getCurrentUser, isLoggedIn } from "./user";
import { getUserRelays } from "./relay";

/**
 * Publish an event to Nostr relays
 */
export async function publishToNostr(event: Partial<NostrEventData>): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to perform this action",
        variant: "destructive"
      });
      return null;
    }

    if (typeof window.nostr === 'undefined') {
      toast({
        title: "Nostr extension not found",
        description: "Please install a Nostr extension like nos2x or Alby",
        variant: "destructive",
      });
      return null;
    }
    
    const currentUser = getCurrentUser();

    // Prepare the event
    const unsignedEvent: UnsignedEvent = {
      kind: event.kind || NOSTR_KINDS.TEXT_NOTE,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
      content: event.content || "",
      pubkey: currentUser?.pubkey || ""
    };

    // Sign the event with the extension
    const signedEvent = await window.nostr.signEvent(unsignedEvent);
    
    if (!signedEvent) {
      throw new Error("Failed to sign event");
    }

    // Validate the event
    const eventHash = getEventHash(signedEvent);
    if (eventHash !== signedEvent.id) {
      throw new Error("Event validation failed: incorrect hash");
    }

    const isValid = validateEvent(signedEvent);
    
    if (!isValid) {
      throw new Error("Event validation failed: invalid signature");
    }

    // Create a pool for publishing to multiple relays
    const pool = new SimplePool();
    const relayUrls = getUserRelays();
    
    // Publish to relays
    try {
      // Use Promise.allSettled instead of Promise.any for better compatibility
      const publishPromises = relayUrls.map(url => {
        return pool.publish([url], signedEvent as Event);
      });
      
      const results = await Promise.allSettled(publishPromises);
      
      // Check if at least one relay accepted the event
      const success = results.some(result => 
        result.status === 'fulfilled'
      );
      
      if (success) {
        toast({
          title: "Published successfully",
          description: "Your action has been published to Nostr"
        });
        
        return signedEvent.id;
      } else {
        throw new Error("Failed to publish to any relay");
      }
    } catch (error) {
      console.error("Failed to publish to relays:", error);
      throw error;
    } finally {
      // Clean up connections
      pool.close(relayUrls);
    }
  } catch (error) {
    console.error("Error publishing to Nostr:", error);
    
    toast({
      title: "Publishing failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    
    return null;
  }
}
