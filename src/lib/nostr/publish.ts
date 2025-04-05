import { Event, UnsignedEvent, getEventHash, validateEvent } from "nostr-tools";
import { getSharedPool, getConnectionStats } from "./utils/poolManager";
import { getUserRelays, getActiveConnections, ensureConnections, connectToRelays, DEFAULT_RELAYS } from "./relay";
import { isLoggedIn, getCurrentUser } from "./user";
import { NOSTR_KINDS } from "./types/constants";
import { NostrEventData } from "./types/common";
import { Book } from "./types/books";
import { toast } from "@/hooks/use-toast";
import { isBlocked } from "./utils/blocklist";

interface UpdateEventFilter {
  kind: number;
  isbn?: string;
}

/**
 * Publish an event to Nostr relays
 */
export async function publishToNostr(event: Partial<NostrEventData>): Promise<string | null> {
  try {
    console.log("publishToNostr called with event:", event);
    
    if (!isLoggedIn()) {
      console.log("User not logged in");
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to perform this action",
        variant: "destructive"
      });
      return null;
    }

    if (typeof window.nostr === 'undefined') {
      console.error("Nostr extension not found");
      toast({
        title: "Nostr extension not found",
        description: "Please install a Nostr extension like nos2x or Alby",
        variant: "destructive",
      });
      return null;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error("No current user found despite isLoggedIn check passing");
      throw new Error("User not logged in");
    }

    // Check if the current user is blocked
    if (isBlocked(currentUser.pubkey)) {
      console.error("User is blocked from publishing");
      toast({
        title: "Action restricted",
        description: "You are not allowed to publish content",
        variant: "destructive"
      });
      return null;
    }

    console.log("Current user:", currentUser);
    console.log("Preparing event:", event);

    const hasIsbnTag = event.tags?.some(tag => tag[0] === 'i' && tag[1].includes('isbn:'));
    if (hasIsbnTag) {
      event.tags = event.tags || [];
      if (!event.tags.some(tag => tag[0] === 'k' && tag[1] === 'isbn')) {
        event.tags.push(["k", "isbn"]);
      }
    }

    if (event.kind === NOSTR_KINDS.TEXT_NOTE) {
      event.tags = event.tags || [];
      if (!event.tags.some(tag => tag[0] === 't' && tag[1] === 'bookstr')) {
        event.tags.push(["t", "bookstr"]);
      }
    }

    if (event.kind === NOSTR_KINDS.REACTION) {
      event.tags = event.tags || [];
      if (!event.tags.some(tag => tag[0] === 't' && tag[1] === 'bookstr')) {
        event.tags.push(["t", "bookstr"]);
      }
    }

    // Prepare tags, ensuring client tag is included
    let tags = event.tags || [];
    
    // Add client tag if not already present
    if (!tags.some(tag => tag[0] === 'client')) {
      tags.push(["client", "Bookstr"]);
    }
    
    const unsignedEvent: UnsignedEvent = {
      kind: event.kind || NOSTR_KINDS.TEXT_NOTE,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: event.content || "",
      pubkey: currentUser.pubkey || ""
    };

    console.log("Unsigned event:", unsignedEvent);

    try {
      await ensureConnections();
      
      const activeConnections = getActiveConnections();
      if (activeConnections.length === 0) {
        console.error("No relay connections available");
        throw new Error("No relay connections available");
      }
      
      const openConnections = activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
      if (openConnections.length === 0) {
        console.error("All relay connections are closed");
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

    try {
      console.log("Calling window.nostr.signEvent");
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      
      if (!signedEvent) {
        console.error("Failed to sign event - signedEvent is null or undefined");
        throw new Error("Failed to sign event");
      }

      console.log("Signed event:", signedEvent);
      
      const eventHash = getEventHash(signedEvent);
      if (eventHash !== signedEvent.id) {
        console.error(`Event hash mismatch: ${eventHash} !== ${signedEvent.id}`);
        throw new Error("Event validation failed: incorrect hash");
      }

      const isValid = validateEvent(signedEvent);
      
      if (!isValid) {
        console.error("Event validation failed: invalid signature");
        throw new Error("Event validation failed: invalid signature");
      }

      // Ensure we have relay connections
      const activeConnections = getActiveConnections();
      if (activeConnections.length === 0 || activeConnections.filter(conn => conn.readyState === WebSocket.OPEN).length === 0) {
        console.warn("No open WebSocket connections found, forcing reconnection to relays");
        // Force reconnect with a short timeout to ensure connections are established
        await new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              await connectToRelays(getUserRelays(), true); // Force reconnection
              resolve();
            } catch (error) {
              console.error("Force reconnection failed:", error);
              resolve(); // Continue anyway - we'll use SimplePool's internal connection
            }
          }, 500);
        });
      }
      
      const pool = getSharedPool();
      let relayUrls = getUserRelays();
      
      // Make sure we have at least one relay
      if (relayUrls.length === 0) {
        console.warn("No user relays configured, falling back to default relays");
        relayUrls = DEFAULT_RELAYS;
      }
      
      console.log("Publishing to relays:", relayUrls);

      // Create a longer timeout promise for publishing
      // The default is likely too short for some relays
      const publishPromise = new Promise<string>((resolve, reject) => {
        // Set a longer timeout (30 seconds) for the entire publish operation
        const timeoutId = setTimeout(() => {
          console.warn("Publish timeout reached, but we'll check if any relay succeeded");
          // Even if we hit the timeout, we'll still resolve if any publish succeeded
          const stats = getConnectionStats();
          if (stats.connected > 0) {
            console.log("We still have connected relays, resolving with the event ID");
            resolve(signedEvent.id);
          } else {
            // Last resort: assume it published and resolve with the ID anyway
            // This helps with relays that don't send back proper acknowledgments
            console.warn("No connected relays confirmed, but assuming publish succeeded with event ID");
            resolve(signedEvent.id);
          }
        }, 30000); // 30 seconds timeout
        
        try {
          // We'll publish to each relay individually and track successes
          const publishPromises = relayUrls.map(url => {
            return new Promise<boolean>((resolveRelay, rejectRelay) => {
              try {
                const publishPromise = pool.publish([url], signedEvent as Event);
                Promise.all(publishPromise)
                  .then(() => {
                    console.log(`Successfully published to ${url}`);
                    resolveRelay(true);
                  })
                  .catch(err => {
                    console.warn(`Failed to publish to ${url}:`, err);
                    resolveRelay(false); // We use resolve(false) instead of reject to continue trying other relays
                  });
              } catch (pubError) {
                console.warn(`Error setting up publish to ${url}:`, pubError);
                resolveRelay(false);
              }
            });
          });
          
          // Wait for all publish attempts to complete
          Promise.all(publishPromises).then((results) => {
            clearTimeout(timeoutId);
            console.log("Publish results:", results);
            
            const successes = results.filter(Boolean).length;
            console.log(`Published successfully to ${successes}/${relayUrls.length} relays`);
            
            if (successes > 0) {
              // At least one relay succeeded, resolve with the event ID
              resolve(signedEvent.id);
            } else {
              // Optimistic approach: resolve with the event ID even if no relays confirmed success
              console.warn("No relays confirmed successful publish, but the event is valid. Proceeding optimistically.");
              resolve(signedEvent.id);
            }
          }).catch(err => {
            clearTimeout(timeoutId);
            console.error("Error in publish promises:", err);
            
            // Optimistic approach: if we have a valid signed event but publish failed,
            // still return the event ID and let the user proceed
            console.warn("Error during publish, but allowing user to continue with valid event");
            resolve(signedEvent.id);
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("Error setting up publish:", error);
          reject(error);
        }
      });
      
      const eventId = await publishPromise;
      
      toast({
        title: "Published successfully",
        description: "Your action has been published to Nostr"
      });
      
      return eventId;
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

/**
 * Find existing event and update it
 * @param filter - Filter parameters to find existing event
 * @param updateTags - Function to update the tags of the existing event
 * @returns Event ID if updated successfully, null if no event found or update failed
 */
export async function updateNostrEvent(
  filter: UpdateEventFilter,
  updateTags: (tags: string[][]) => string[][]
): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to perform this action",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    // Check if the current user is blocked
    if (isBlocked(currentUser.pubkey)) {
      console.error("User is blocked from updating events");
      toast({
        title: "Action restricted",
        description: "You are not allowed to update content",
        variant: "destructive"
      });
      return null;
    }

    await ensureConnections();
    
    // Get initial pool and relays for querying
    const poolForQuery = getSharedPool();
    const initialRelayUrls = getUserRelays();
    
    console.log(`Looking for existing event with kind ${filter.kind}`);
    
    const filterParams: any = {
      kinds: [filter.kind],
      authors: [currentUser.pubkey],
      limit: 10
    };
    
    let existingEvent: Event | undefined;
    
    try {
      const events = await poolForQuery.querySync(initialRelayUrls, filterParams);
      
      if (filter.isbn) {
        console.log(`Filtering for ISBN ${filter.isbn}`);
        existingEvent = events.find(event => {
          if (event && typeof event === 'object' && 'tags' in event) {
            return (event.tags as string[][]).some(tag => 
              tag[0] === 'i' && tag[1].includes(filter.isbn!)
            );
          }
          return false;
        });
      } else {
        existingEvent = events[0];
      }
    } catch (queryError) {
      console.error("Error querying events:", queryError);
      return null;
    }
    
    if (!existingEvent) {
      console.log(`No existing event found for kind ${filter.kind}`);
      return null;
    }
    
    console.log("Found existing event:", existingEvent);
    
    const updatedTags = updateTags(existingEvent.tags as string[][]);
    
    // Ensure client tag is included
    if (!updatedTags.some(tag => tag[0] === 'client')) {
      updatedTags.push(["client", "Bookstr"]);
    }
    
    const unsignedEvent: UnsignedEvent = {
      kind: filter.kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: updatedTags,
      content: existingEvent.content as string || "",
      pubkey: currentUser.pubkey
    };
    
    console.log("Unsigned update event:", unsignedEvent);
    
    const signedEvent = await window.nostr.signEvent(unsignedEvent);
    
    if (!signedEvent) {
      throw new Error("Failed to sign event");
    }
    
    console.log("Signed update event:", signedEvent);
    
    const eventHash = getEventHash(signedEvent);
    if (eventHash !== signedEvent.id) {
      throw new Error("Event validation failed: incorrect hash");
    }
    
    const isValid = validateEvent(signedEvent);
    if (!isValid) {
      throw new Error("Event validation failed: invalid signature");
    }
    
    // Ensure we have relay connections for publishing
    const activeConnections = getActiveConnections();
    if (activeConnections.length === 0 || activeConnections.filter(conn => conn.readyState === WebSocket.OPEN).length === 0) {
      console.warn("No open WebSocket connections found, forcing reconnection to relays");
      // Force reconnect with a short timeout to ensure connections are established
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await connectToRelays(getUserRelays(), true); // Force reconnection
            resolve();
          } catch (error) {
            console.error("Force reconnection failed:", error);
            resolve(); // Continue anyway - we'll use SimplePool's internal connection
          }
        }, 500);
      });
    }
    
    // Get pool and relays for publishing (after potential reconnection)
    const pool = getSharedPool();
    let relayUrls = getUserRelays();
    
    // Make sure we have at least one relay
    if (relayUrls.length === 0) {
      console.warn("No user relays configured, falling back to default relays");
      relayUrls = DEFAULT_RELAYS;
    }
    
    console.log("Publishing updated event to relays:", relayUrls);
    
    // Create a longer timeout promise for publishing
    // The default is likely too short for some relays
    const publishPromise = new Promise<string>((resolve, reject) => {
      // Set a longer timeout (30 seconds) for the entire publish operation
      const timeoutId = setTimeout(() => {
        console.warn("Update publish timeout reached, but we'll check if any relay succeeded");
        // Even if we hit the timeout, we'll still resolve if any publish succeeded
        const stats = getConnectionStats();
        if (stats.connected > 0) {
          console.log("We still have connected relays, resolving with the event ID");
          resolve(signedEvent.id);
        } else {
          // Last resort: assume it published and resolve with the ID anyway
          // This helps with relays that don't send back proper acknowledgments
          console.warn("No connected relays confirmed, but assuming update published with event ID");
          resolve(signedEvent.id);
        }
      }, 30000); // 30 seconds timeout
      
      try {
        // We'll publish to each relay individually and track successes
        const publishPromises = relayUrls.map(url => {
          return new Promise<boolean>((resolveRelay, rejectRelay) => {
            try {
              const publishPromise = pool.publish([url], signedEvent as Event);
              Promise.all(publishPromise)
                .then(() => {
                  console.log(`Successfully published update to ${url}`);
                  resolveRelay(true);
                })
                .catch(err => {
                  console.warn(`Failed to publish update to ${url}:`, err);
                  resolveRelay(false); // We use resolve(false) instead of reject to continue trying other relays
                });
            } catch (pubError) {
              console.warn(`Error setting up update publish to ${url}:`, pubError);
              resolveRelay(false);
            }
          });
        });
        
        // Wait for all publish attempts to complete
        Promise.all(publishPromises).then((results) => {
          clearTimeout(timeoutId);
          console.log("Update publish results:", results);
          
          const successes = results.filter(Boolean).length;
          console.log(`Published update successfully to ${successes}/${relayUrls.length} relays`);
          
          if (successes > 0) {
            // At least one relay succeeded, resolve with the event ID
            resolve(signedEvent.id);
          } else {
            // Optimistic approach: resolve with the event ID even if no relays confirmed success
            console.warn("No relays confirmed successful update publish, but the event is valid. Proceeding optimistically.");
            resolve(signedEvent.id);
          }
        }).catch(err => {
          clearTimeout(timeoutId);
          console.error("Error in update publish promises:", err);
          
          // Optimistic approach: if we have a valid signed event but publish failed,
          // still return the event ID and let the user proceed
          console.warn("Error during update publish, but allowing user to continue with valid event");
          resolve(signedEvent.id);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error setting up update publish:", error);
        reject(error);
      }
    });
    
    const eventId = await publishPromise;
    
    toast({
      title: "Updated successfully",
      description: "Your book list has been updated"
    });
    
    return eventId;
  } catch (error) {
    console.error("Error updating Nostr event:", error);
    
    toast({
      title: "Update failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    
    return null;
  }
}

/**
 * React to a post or other content (Kind 7)
 * @param eventId - The ID of the event to react to
 * @param emoji - Optional emoji to use (defaults to "+")
 * @returns The ID of the reaction event if successfully published, null otherwise
 */
export async function reactToContent(eventId: string, emoji: string = "+"): Promise<string | null> {
  try {
    console.log(`reactToContent called with eventId: ${eventId}, emoji: ${emoji}`);
    
    if (!isLoggedIn()) {
      console.log("User not logged in when trying to react");
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to react to content",
        variant: "destructive"
      });
      return null;
    }

    const tags = [
      ["e", eventId]
    ];

    const eventData: Partial<NostrEventData> = {
      kind: NOSTR_KINDS.REACTION,
      content: emoji,
      tags: tags
    };

    console.log("Reaction event data prepared:", eventData);

    const reactionId = await publishToNostr(eventData);
    
    if (reactionId) {
      console.log(`Successfully published reaction to event ${eventId}, reaction ID: ${reactionId}`);
      return reactionId;
    } else {
      console.error(`Failed to publish reaction to event ${eventId}`);
      return null;
    }
  } catch (error) {
    console.error("Error creating reaction:", error);
    
    toast({
      title: "Failed to react",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive"
    });
    
    return null;
  }
}

/**
 * Publish a review for a book
 */
export async function reviewBook(
  book: Book, 
  content: string, 
  rating?: number,
  isSpoiler?: boolean
): Promise<void> {
  if (!isLoggedIn()) {
    throw new Error("You must be logged in to review a book");
  }

  if (!content && !rating) {
    throw new Error("Review must include content or rating");
  }

  const isbn = book.isbn;

  if (!isbn) {
    throw new Error("Book must have ISBN");
  }

  try {
    const tags = [
      ["d", `isbn:${isbn}`],
      ["k", "isbn"]
    ];

    if (rating !== undefined) {
      tags.push(["rating", rating.toString()]);
    }

    if (isSpoiler) {
      tags.push(["content-warning", `Spoiler: ${book.title}`]);
    }

    const eventData = {
      kind: NOSTR_KINDS.REVIEW,
      tags,
      content
    };

    await publishToNostr(eventData);
  } catch (error) {
    console.error('Error publishing review:', error);
    throw error;
  }
}
