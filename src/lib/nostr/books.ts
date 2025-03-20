import { Book, NOSTR_KINDS, BookActionType, Reply } from "./types";
import { publishToNostr, updateNostrEvent } from "./publish";
import { SimplePool, Event } from "nostr-tools";
import { getCurrentUser } from "./user";
import { getUserRelays } from "./relay";
import { fetchFollowingList } from "./fetch";
import { toast } from "@/hooks/use-toast";

/**
 * Fetch all ISBNs from a specific list type
 */
async function fetchExistingIsbnTags(listType: BookActionType): Promise<string[][]> {
  console.log(`==== Fetching existing ISBNs from ${listType} list ====`);
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error("Cannot fetch ISBNs: User not logged in");
    return [];
  }
  
  let kind: number;
  switch (listType) {
    case 'tbr':
      kind = NOSTR_KINDS.BOOK_TBR;
      break;
    case 'reading':
      kind = NOSTR_KINDS.BOOK_READING;
      break;
    case 'finished':
      kind = NOSTR_KINDS.BOOK_READ;
      break;
    default:
      console.error(`Unknown list type: ${listType}`);
      return [];
  }
  
  const pool = new SimplePool();
  const relayUrls = getUserRelays();
  
  try {
    const filterParams = {
      kinds: [kind],
      authors: [currentUser.pubkey],
      limit: 10
    };
    
    const events = await pool.querySync(relayUrls, filterParams);
    
    if (events.length === 0) {
      console.log(`No existing events found for ${listType} list`);
      return [];
    }
    
    // Get the most recent event
    const mostRecent = events[0];
    
    // Extract all ISBN tags
    const isbnTags = mostRecent.tags.filter(tag => tag[0] === 'i');
    console.log(`Found ${isbnTags.length} existing ISBN tags:`, isbnTags);
    
    return isbnTags;
  } catch (error) {
    console.error(`Error fetching existing ISBNs for ${listType} list:`, error);
    return [];
  } finally {
    pool.close(relayUrls);
  }
}

/**
 * Add a book to the "TBR" list
 */
export async function addBookToTBR(book: Book): Promise<string | null> {
  console.log("==== Adding book to TBR ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  if (!book.isbn) {
    console.error("Cannot add book to TBR: ISBN is missing");
    return null;
  }
  
  // First, try to fetch existing ISBN tags
  const existingTags = await fetchExistingIsbnTags('tbr');
  
  // Create a new tag for the current book
  const newIsbnTag = ["i", `isbn:${book.isbn}`];
  
  // Check if this ISBN is already in the list to avoid duplicates
  const isbnAlreadyExists = existingTags.some(tag => tag[1] === `isbn:${book.isbn}`);
  
  // Create the full list of tags, avoiding duplicates
  const allTags = isbnAlreadyExists 
    ? existingTags 
    : [...existingTags, newIsbnTag];
  
  // Add k tag for isbn
  allTags.push(["k", "isbn"]);
  
  console.log("Combined tags for TBR event:", allTags);
  
  const event = {
    kind: NOSTR_KINDS.BOOK_TBR,
    tags: allTags,
    content: ""
  };
  
  console.log("Publishing TBR event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("TBR publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in addBookToTBR:", error);
    throw error;
  }
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(book: Book): Promise<string | null> {
  console.log("==== Marking book as reading ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  if (!book.isbn) {
    console.error("Cannot mark book as reading: ISBN is missing");
    return null;
  }
  
  // First, try to fetch existing ISBN tags
  const existingTags = await fetchExistingIsbnTags('reading');
  
  // Create a new tag for the current book
  const newIsbnTag = ["i", `isbn:${book.isbn}`];
  
  // Check if this ISBN is already in the list to avoid duplicates
  const isbnAlreadyExists = existingTags.some(tag => tag[1] === `isbn:${book.isbn}`);
  
  // Create the full list of tags, avoiding duplicates
  const allTags = isbnAlreadyExists 
    ? existingTags 
    : [...existingTags, newIsbnTag];
  
  // Add k tag for isbn
  allTags.push(["k", "isbn"]);
  
  const event = {
    kind: NOSTR_KINDS.BOOK_READING,
    tags: allTags,
    content: ""
  };
  
  console.log("Publishing reading event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("Reading publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in markBookAsReading:", error);
    throw error;
  }
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: Book, rating?: number): Promise<string | null> {
  console.log("==== Marking book as read ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  if (!book.isbn) {
    console.error("Cannot mark book as read: ISBN is missing");
    return null;
  }
  
  // First, try to fetch existing ISBN tags
  const existingTags = await fetchExistingIsbnTags('finished');
  
  // Create a new tag for the current book
  const newIsbnTag = ["i", `isbn:${book.isbn}`];
  
  // Check if this ISBN is already in the list to avoid duplicates
  const isbnAlreadyExists = existingTags.some(tag => tag[1] === `isbn:${book.isbn}`);
  
  // Create the full list of tags, avoiding duplicates
  const allTags = isbnAlreadyExists 
    ? existingTags 
    : [...existingTags, newIsbnTag];
  
  // Add k tag for isbn
  allTags.push(["k", "isbn"]);
  
  const event = {
    kind: NOSTR_KINDS.BOOK_READ,
    tags: allTags,
    content: ""
  };
  
  console.log("Publishing read event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("Read publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in markBookAsRead:", error);
    throw error;
  }
}

/**
 * Rate a book separately
 */
export async function rateBook(book: Book, rating: number): Promise<string | null> {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  
  if (!book.isbn) {
    console.error("Cannot rate book: ISBN is missing");
    return null;
  }
  
  const event = {
    kind: NOSTR_KINDS.BOOK_RATING,
    tags: [
      ["i", `isbn:${book.isbn}`],
      ["rating", rating.toString()],
      ["k", "isbn"]
    ],
    content: ""
  };
  
  return publishToNostr(event);
}

/**
 * Post a review for a book
 */
export async function reviewBook(book: Book, reviewText: string, rating?: number): Promise<string | null> {
  if (!book.isbn) {
    console.error("Cannot review book: ISBN is missing");
    return null;
  }
  
  // Create tags array with the required format
  const tags = [
    ["d", `isbn:${book.isbn}`],
    ["k", "isbn"]
  ];
  
  // Add rating tag if provided, convert from 1-5 scale to 0-1 scale
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    const normalizedRating = (rating / 5).toFixed(2);
    tags.push(["rating", normalizedRating]);
  }
  
  const event = {
    kind: NOSTR_KINDS.REVIEW,
    tags,
    content: reviewText
  };
  
  console.log("Publishing review event:", event);
  return publishToNostr(event);
}

/**
 * React to content (review, rating, etc)
 */
export async function reactToContent(eventId: string): Promise<string | null> {
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
export async function replyToContent(eventId: string, pubkey: string, replyText: string): Promise<string | null> {
  if (!eventId || !replyText.trim()) {
    console.error("Cannot reply: missing eventId or reply text");
    return null;
  }

  // Determine if this is a reply to a post or a book-related event
  let kind = NOSTR_KINDS.BOOK_LIST_REPLY; // Default to book list reply

  try {
    // Fetch the original event to determine its kind
    const originalEvent = await fetchEventById(eventId);
    
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
export async function fetchEventById(eventId: string): Promise<Event | null> {
  if (!eventId) {
    console.error("Cannot fetch event: missing eventId");
    return null;
  }
  
  const pool = new SimplePool();
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
  } finally {
    pool.close(relayUrls);
  }
}

/**
 * Fetch reactions for a specific event
 */
export async function fetchReactions(eventId: string): Promise<{ count: number; userReacted: boolean }> {
  const relays = getUserRelays();
  const pool = new SimplePool();
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
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch replies for a specific event
 */
export async function fetchReplies(eventId: string): Promise<Reply[]> {
  if (!eventId) {
    console.error("Cannot fetch replies: missing eventId");
    return [];
  }
  
  const pool = new SimplePool();
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
    const profiles = await fetchProfilesForPubkeys(authorPubkeys);
    
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
  } finally {
    pool.close(relayUrls);
  }
}

/**
 * Fetch profiles for a list of pubkeys
 */
async function fetchProfilesForPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
  if (!pubkeys.length) return {};
  
  const pool = new SimplePool();
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
  } finally {
    pool.close(relayUrls);
  }
}

/**
 * Follow a user
 */
export async function followUser(pubkey: string): Promise<string | null> {
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

/**
 * Try to update an existing book in a list
 * Returns true if the update was successful, false if no existing event was found
 */
export async function updateBookInList(book: Book, listType: BookActionType): Promise<boolean> {
  console.log(`==== Updating book in ${listType} list ====`);
  
  if (!book.isbn) {
    console.error(`Cannot update book in ${listType} list: ISBN is missing`);
    return false;
  }
  
  let kind: number;
  switch (listType) {
    case 'tbr':
      kind = NOSTR_KINDS.BOOK_TBR;
      break;
    case 'reading':
      kind = NOSTR_KINDS.BOOK_READING;
      break;
    case 'finished':
      kind = NOSTR_KINDS.BOOK_READ;
      break;
    default:
      console.error(`Unknown list type: ${listType}`);
      return false;
  }
  
  try {
    // The updateNostrEvent function will try to find an existing event with the specified kind
    // If found, it updates the event with the new tags
    const result = await updateNostrEvent(
      { kind },
      (prevTags) => {
        // Extract all existing ISBN tags
        const isbnTags = prevTags.filter(tag => tag[0] === 'i');
        
        // Create a set to track unique ISBNs (without the 'isbn:' prefix)
        const isbnSet = new Set<string>();
        
        // Add existing ISBNs to the set
        isbnTags.forEach(tag => {
          if (tag[1]) {
            isbnSet.add(tag[1]);
          }
        });
        
        // Add the new ISBN if it's not already in the set
        const newIsbnTag = `isbn:${book.isbn}`;
        isbnSet.add(newIsbnTag);
        
        // Keep non-ISBN tags
        const otherTags = prevTags.filter(tag => tag[0] !== 'i');
        
        // Create the updated tags array with all ISBNs
        const updatedTags = [
          ...otherTags,
          ...Array.from(isbnSet).map(isbn => ['i', isbn])
        ];
        
        console.log('Updated tags with all ISBNs:', updatedTags);
        return updatedTags;
      }
    );
    
    if (result) {
      console.log(`Successfully updated book in ${listType} list:`, result);
      return true;
    }
    
    console.log(`No existing event found for ${listType} list, need to create new one`);
    return false;
  } catch (error) {
    console.error(`Error updating book in ${listType} list:`, error);
    return false;
  }
}

/**
 * Unified function to add a book to any of the reading lists
 */
export async function addBookToList(book: Book, listType: BookActionType): Promise<string | null> {
  console.log(`==== Adding book to ${listType} list ====`);
  
  if (!book.isbn) {
    console.error(`Cannot add book to ${listType} list: ISBN is missing`);
    return null;
  }
  
  // Try to update existing list first
  const updated = await updateBookInList(book, listType);
  
  // If update succeeded, we're done
  if (updated) {
    return null; // We don't have the event ID here, but the update was successful
  }
  
  // Otherwise create a new list with just this book
  switch (listType) {
    case 'tbr':
      return addBookToTBR(book);
    case 'reading':
      return markBookAsReading(book);
    case 'finished':
      return markBookAsRead(book);
    default:
      console.error(`Unknown list type: ${listType}`);
      return null;
  }
}

/**
 * Remove a book from a specific list
 */
export async function removeBookFromList(book: Book, listType: BookActionType): Promise<string | null> {
  console.log(`==== Removing book from ${listType} list ====`);
  
  if (!book.isbn) {
    console.error(`Cannot remove book from ${listType} list: ISBN is missing`);
    return null;
  }
  
  let kind: number;
  switch (listType) {
    case 'tbr':
      kind = NOSTR_KINDS.BOOK_TBR;
      break;
    case 'reading':
      kind = NOSTR_KINDS.BOOK_READING;
      break;
    case 'finished':
      kind = NOSTR_KINDS.BOOK_READ;
      break;
    default:
      console.error(`Unknown list type: ${listType}`);
      return null;
  }
  
  try {
    // The updateNostrEvent function will try to find an existing event with the specified kind
    // If found, it updates the event by removing the specified ISBN
    const result = await updateNostrEvent(
      { kind },
      (prevTags) => {
        // Keep all tags that are not this specific ISBN
        const isbnToRemove = `isbn:${book.isbn}`;
        const updatedTags = prevTags.filter(tag => !(tag[0] === 'i' && tag[1] === isbnToRemove));
        
        // Ensure we still have the 'k' tag for isbn
        if (updatedTags.some(tag => tag[0] === 'i')) {
          // Only keep 'k' tag if we still have other ISBNs
          if (!updatedTags.some(tag => tag[0] === 'k' && tag[1] === 'isbn')) {
            updatedTags.push(['k', 'isbn']);
          }
        }
        
        console.log('Updated tags after removing ISBN:', updatedTags);
        return updatedTags;
      }
    );
    
    if (result) {
      console.log(`Successfully removed book from ${listType} list:`, result);
      return result;
    }
    
    console.log(`No existing event found for ${listType} list, nothing to remove`);
    return null;
  } catch (error) {
    console.error(`Error removing book from ${listType} list:`, error);
    throw error;
  }
}
