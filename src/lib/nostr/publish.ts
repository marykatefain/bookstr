
import { toast } from "@/hooks/use-toast";
import { SimplePool, validateEvent, getEventHash, type Event, type UnsignedEvent } from "nostr-tools";
import { NostrEventData, NOSTR_KINDS } from "./types";
import { getCurrentUser, isLoggedIn } from "./user";
import { getUserRelays, ensureConnections, getActiveConnections } from "./relay";

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
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log("Current user:", currentUser);
    console.log("Preparing event:", event);

    // Prepare the event
    const unsignedEvent: UnsignedEvent = {
      kind: event.kind || NOSTR_KINDS.TEXT_NOTE,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
      content: event.content || "",
      pubkey: currentUser.pubkey || ""
    };

    console.log("Unsigned event:", unsignedEvent);

    // Ensure we have active connections to relays before signing
    try {
      // This will wait for connections to be established
      await ensureConnections();
      
      // Verify we have active connections before proceeding
      const activeConnections = getActiveConnections();
      if (activeConnections.length === 0) {
        throw new Error("No relay connections available");
      }
      
      // Check that at least one connection is open
      const openConnections = activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
      if (openConnections.length === 0) {
        throw new Error("All relay connections are closed");
      }
      
      console.log(`Proceeding with ${openConnections.length} open relay connections`);
    } catch (connError) {
      console.error("Error with relay connections:", connError);
      toast({
        title: "Connection error",
        description: "Failed to establish relay connections. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    // Sign the event with the extension
    try {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }

      console.log("Signed event:", signedEvent);
      
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
      
      console.log("Publishing to relays:", relayUrls);
      
      // Publish to relays
      try {
        // Add a timeout to ensure we give enough time for the event to be published
        const publishPromise = new Promise<string>((resolve, reject) => {
          // Use Promise.allSettled to track all publish attempts
          const publishPromises = relayUrls.map(url => {
            return pool.publish([url], signedEvent as Event);
          });
          
          Promise.allSettled(publishPromises).then(results => {
            console.log("Publish results:", results);
            
            // Check if at least one relay accepted the event
            const success = results.some(result => 
              result.status === 'fulfilled'
            );
            
            if (success) {
              // Delay the resolution to ensure the message has time to propagate
              setTimeout(() => {
                resolve(signedEvent.id);
              }, 1000);
            } else {
              reject(new Error("Failed to publish to any relay"));
            }
          });
        });
        
        const eventId = await publishPromise;
        
        // Only close the pool after the timeout, giving events time to propagate
        setTimeout(() => {
          pool.close(relayUrls);
        }, 2000);
        
        toast({
          title: "Published successfully",
          description: "Your action has been published to Nostr"
        });
        
        return eventId;
      } catch (error) {
        console.error("Failed to publish to relays:", error);
        // Still need to clean up the pool
        pool.close(relayUrls);
        throw error;
      }
    } catch (signError) {
      console.error("Error signing event:", signError);
      throw signError;
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
