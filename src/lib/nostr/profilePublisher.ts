import { Event, UnsignedEvent, getEventHash, validateEvent } from "nostr-tools";
import { getSharedPool } from "./utils/poolManager";
import { getUserRelays, ensureConnections } from "./relay";
import { NOSTR_KINDS } from "./types/constants";
import { NostrEventData } from "./types/common";
import { toast } from "@/hooks/use-toast";

/**
 * Updates the user's profile metadata (Kind 0)
 * This function is separate from other publish functions to avoid circular dependencies
 * 
 * @param event - The event data containing profile information
 * @param currentUser - The current user profile
 * @returns Event ID if updated successfully, null otherwise
 */
export async function updateNostrProfile(
  event: Partial<NostrEventData>,
  currentUser: { pubkey: string }
): Promise<string | null> {
  try {
    if (!currentUser || !currentUser.pubkey) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to update your profile",
        variant: "destructive"
      });
      return null;
    }

    await ensureConnections();
    
    // Ensure the kind is SET_METADATA (0)
    if (event.kind !== NOSTR_KINDS.SET_METADATA) {
      console.error("Invalid event kind for profile update. Expected kind 0.");
      throw new Error("Invalid event kind for profile update");
    }

    // Create the unsigned event
    const unsignedEvent: UnsignedEvent = {
      kind: NOSTR_KINDS.SET_METADATA,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
      content: event.content || "{}",
      pubkey: currentUser.pubkey
    };
    
    console.log("Unsigned profile update event:", unsignedEvent);
    
    // Sign the event using the Nostr extension
    const signedEvent = await window.nostr.signEvent(unsignedEvent);
    
    if (!signedEvent) {
      throw new Error("Failed to sign profile update event");
    }
    
    console.log("Signed profile update event:", signedEvent);
    
    // Validate the event
    const eventHash = getEventHash(signedEvent);
    if (eventHash !== signedEvent.id) {
      throw new Error("Profile update validation failed: incorrect hash");
    }
    
    const isValid = validateEvent(signedEvent);
    if (!isValid) {
      throw new Error("Profile update validation failed: invalid signature");
    }
    
    // Publish to relays
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    console.log("Publishing profile update to relays:", relayUrls);
    
    const publishPromise = new Promise<string>((resolve, reject) => {
      const publishPromises = relayUrls.map(url => {
        return pool.publish([url], signedEvent as Event);
      });
      
      Promise.allSettled(publishPromises).then(results => {
        console.log("Profile update publish results:", results);
        
        const success = results.some(result => 
          result.status === 'fulfilled'
        );
        
        if (success) {
          setTimeout(() => {
            resolve(signedEvent.id);
          }, 1000);
        } else {
          reject(new Error("Failed to publish profile update to any relay"));
        }
      });
    });
    
    const eventId = await publishPromise;
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully"
    });
    
    return eventId;
  } catch (error) {
    console.error("Error updating Nostr profile:", error);
    
    toast({
      title: "Profile update failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    
    return null;
  }
}