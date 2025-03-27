import { Event, UnsignedEvent, getEventHash, validateEvent } from "nostr-tools";
import { SimplePool } from "nostr-tools";
import { getSharedPool } from "./utils/poolManager";
import { getUserRelays, getActiveConnections, ensureConnections } from "./relay";
import { isLoggedIn, getCurrentUser } from "./user";
import { NOSTR_KINDS } from "./types/constants";
import { NostrEventData } from "./types/common";
import { toast } from "@/hooks/use-toast";

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

    const unsignedEvent: UnsignedEvent = {
      kind: event.kind || NOSTR_KINDS.TEXT_NOTE,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
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

      const pool = getSharedPool();
      const relayUrls = getUserRelays();
      
      console.log("Publishing to relays:", relayUrls);
      
      const publishPromise = new Promise<string>((resolve, reject) => {
        const publishPromises = relayUrls.map(url => {
          return pool.publish([url], signedEvent as Event);
        });
        
        Promise.allSettled(publishPromises).then(results => {
          console.log("Publish results:", results);
          
          const success = results.some(result => 
            result.status === 'fulfilled'
          );
          
          if (success) {
            setTimeout(() => {
              resolve(signedEvent.id);
            }, 1000);
          } else {
            reject(new Error("Failed to publish to any relay"));
          }
        });
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

    await ensureConnections();
    
    const pool = getSharedPool();
    const relayUrls = getUserRelays();
    
    console.log(`Looking for existing event with kind ${filter.kind}`);
    
    const filterParams: any = {
      kinds: [filter.kind],
      authors: [currentUser.pubkey],
      limit: 10
    };
    
    let existingEvent: Event | undefined;
    
    try {
      const events = await pool.querySync(relayUrls, filterParams);
      
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
    
    console.log("Publishing updated event to relays:", relayUrls);
    
    const publishPromise = new Promise<string>((resolve, reject) => {
      const publishPromises = relayUrls.map(url => {
        return pool.publish([url], signedEvent as Event);
      });
      
      Promise.allSettled(publishPromises).then(results => {
        console.log("Update publish results:", results);
        
        const success = results.some(result => 
          result.status === 'fulfilled'
        );
        
        if (success) {
          setTimeout(() => {
            resolve(signedEvent.id);
          }, 1000);
        } else {
          reject(new Error("Failed to publish update to any relay"));
        }
      });
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

    const event = await getUser().publish({
      kind: NOSTR_KINDS.REVIEW,
      tags,
      content
    });

    console.log('Published review event:', event);
  } catch (error) {
    console.error('Error publishing review:', error);
    throw error;
  }
}
