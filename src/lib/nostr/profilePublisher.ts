import { Event, UnsignedEvent, getEventHash, validateEvent } from "nostr-tools";
import { getSharedPool } from "./utils/poolManager";
import { getUserRelays, ensureConnections } from "./relay";
import { NOSTR_KINDS } from "./types/constants";
import { NostrEventData } from "./types/common";
import { toast } from "@/hooks/use-toast";

/**
 * Fetch the most recent profile metadata (Kind 0) event for a user
 * 
 * @param pubkey - The public key of the user
 * @returns The most recent Kind 0 event or null if none found
 */
async function fetchLatestProfileEvent(pubkey: string): Promise<Event | null> {
  try {
    console.log(`Fetching latest profile event for ${pubkey}`);
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    const filterParams = {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: [pubkey],
      limit: 10 // Get several recent events to ensure we find the latest one
    };
    
    const events = await pool.querySync(relayUrls, filterParams);
    
    if (!events || events.length === 0) {
      console.log(`No existing Kind 0 events found for ${pubkey}`);
      return null;
    }
    
    // Sort by created_at in descending order (newest first)
    const sortedEvents = [...events].sort((a, b) => 
      (b.created_at || 0) - (a.created_at || 0)
    );
    
    console.log(`Found ${events.length} profile events, using the most recent one`);
    return sortedEvents[0];
  } catch (error) {
    console.error("Error fetching latest profile event:", error);
    return null;
  }
}

/**
 * Parse the profile content while preserving all fields
 * 
 * @param existing - The existing content JSON string
 * @param updates - The fields to update
 * @returns The merged content as a JSON string
 */
function mergeProfileContent(existing: string, updates: string): string {
  try {
    // Parse both content strings into objects
    let existingContent = {};
    try {
      existingContent = JSON.parse(existing);
      if (typeof existingContent !== 'object' || existingContent === null) {
        existingContent = {};
      }
    } catch (e) {
      console.error("Error parsing existing profile content:", e);
    }
    
    let updatesContent = {};
    try {
      updatesContent = JSON.parse(updates);
      if (typeof updatesContent !== 'object' || updatesContent === null) {
        updatesContent = {};
      }
    } catch (e) {
      console.error("Error parsing update profile content:", e);
    }
    
    // Merge the objects, with updates taking precedence
    const mergedContent = {
      ...existingContent,
      ...updatesContent
    };
    
    return JSON.stringify(mergedContent);
  } catch (error) {
    console.error("Error merging profile content:", error);
    return updates; // Fall back to just the updates if merging fails
  }
}

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

    // 1. Fetch the most recent Kind 0 event for this user
    const latestProfileEvent = await fetchLatestProfileEvent(currentUser.pubkey);
    
    // 2. Preserve existing tags and merge with new tags if any
    let mergedTags: string[][] = [];
    
    if (latestProfileEvent && Array.isArray(latestProfileEvent.tags)) {
      mergedTags = [...latestProfileEvent.tags];
    }
    
    // Add new tags, if any
    if (event.tags && Array.isArray(event.tags)) {
      // For each tag in the new event, replace existing tags with the same name
      // or add if it doesn't exist
      event.tags.forEach(newTag => {
        if (newTag.length > 0) {
          const tagName = newTag[0];
          const existingTagIndex = mergedTags.findIndex(tag => tag[0] === tagName);
          
          if (existingTagIndex >= 0) {
            mergedTags[existingTagIndex] = newTag;
          } else {
            mergedTags.push(newTag);
          }
        }
      });
    }

    // 3. Merge the content objects, preserving all fields
    let mergedContent = event.content || "{}";
    
    if (latestProfileEvent && typeof latestProfileEvent.content === 'string') {
      mergedContent = mergeProfileContent(latestProfileEvent.content, event.content || "{}");
    }

    // 4. Create the unsigned event with merged data
    const unsignedEvent: UnsignedEvent = {
      kind: NOSTR_KINDS.SET_METADATA,
      created_at: Math.floor(Date.now() / 1000),
      tags: mergedTags,
      content: mergedContent,
      pubkey: currentUser.pubkey
    };
    
    console.log("Unsigned profile update event with preserved fields:", unsignedEvent);
    
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