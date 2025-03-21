import { toast } from "@/hooks/use-toast";
import {
  NostrEventData,
  Post,
  Book,
  NOSTR_KINDS,
  SocialActivity
} from "./types";
import { publishToNostr, updateNostrEvent } from "./publish";
import { getCurrentUser, isLoggedIn } from "./user";
import { nip19 } from "nostr-tools";
import { getUserRelays } from "./relay";
import { getSharedPool } from "./utils/poolManager";

/**
 * Add a book to the user's TBR list
 */
export async function addBookToTBR(book: Book): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to add to TBR",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.BOOK_TBR,
      content: `Want to read ${book.title} by ${book.author}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error adding book to TBR:", error);
    toast({
      title: "Error",
      description: "Could not add book to TBR",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(book: Book): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to mark as reading",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.BOOK_READING,
      content: `Currently reading ${book.title} by ${book.author}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error marking book as reading:", error);
    toast({
      title: "Error",
      description: "Could not mark book as reading",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: Book): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to mark as read",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.BOOK_READ,
      content: `Finished reading ${book.title} by ${book.author}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error marking book as read:", error);
    toast({
      title: "Error",
      description: "Could not mark book as read",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Rate a book
 * @param book - The book to rate
 * @param rating - The rating to give the book (0-1)
 */
export async function rateBook(book: Book, rating: number): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to rate a book",
        variant: "destructive"
      });
      return null;
    }

    if (rating < 0 || rating > 1) {
      throw new Error("Rating must be between 0 and 1");
    }

    const tags: string[][] = [
      ["i", `isbn:${book.isbn}`],
      ["rating", rating.toString()]
    ];

    const eventData = {
      kind: NOSTR_KINDS.BOOK_RATING,
      content: `Rated ${book.title} by ${book.author} ${rating * 5} stars`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error rating book:", error);
    toast({
      title: "Error",
      description: "Could not rate book",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Review a book
 * @param book - The book to review
 * @param review - The review text
 */
export async function reviewBook(book: Book, review: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to review a book",
        variant: "destructive"
      });
      return null;
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.REVIEW,
      content: review,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error reviewing book:", error);
    toast({
      title: "Error",
      description: "Could not review book",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Follow a user
 * @param pubkey - The pubkey of the user to follow
 */
export async function followUser(pubkey: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to follow a user",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["p", pubkey]];

    const eventData = {
      kind: NOSTR_KINDS.CONTACTS,
      content: `Following ${pubkey}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error following user:", error);
    toast({
      title: "Error",
      description: "Could not follow user",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Add a book to a list
 * @param book - The book to add to the list
 * @param listName - The name of the list to add the book to
 */
export async function addBookToList(book: Book, listName: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to add a book to a list",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.GENERIC_LIST,
      content: `Added ${book.title} to ${listName}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error adding book to list:", error);
    toast({
      title: "Error",
      description: "Could not add book to list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Update a book in a list
 * @param book - The book to update in the list
 * @param listName - The name of the list to update the book in
 */
export async function updateBookInList(book: Book, listName: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to update a book in a list",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.GENERIC_LIST,
      content: `Updated ${book.title} in ${listName}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error updating book in list:", error);
    toast({
      title: "Error",
      description: "Could not update book in list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Remove a book from a list
 * @param book - The book to remove from the list
 * @param listName - The name of the list to remove the book from
 */
export async function removeBookFromList(book: Book, listName: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to remove a book from a list",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    const tags: string[][] = [["i", `isbn:${book.isbn}`]];

    const eventData = {
      kind: NOSTR_KINDS.GENERIC_LIST,
      content: `Removed ${book.title} from ${listName}`,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error removing book from list:", error);
    toast({
      title: "Error",
      description: "Could not remove book from list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * React to a content using Nostr Kind 7 event
 */
export async function reactToContent(eventId: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    // Check if user has already reacted
    const currentReactions = await fetchReactions(eventId);
    if (currentReactions.userReacted) {
      // If user has already reacted, we're removing the reaction
      // This would ideally use a kind 5 deletion event, but for simplicity
      // in the current implementation we'll just return and not add a new reaction
      throw new Error("You've already reacted to this content");
    }

    // Prepare the reaction event
    const tags: string[][] = [
      ["e", eventId]
    ];

    const eventData = {
      kind: NOSTR_KINDS.REACTION,
      content: "+", // Standard "like" reaction
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error reacting to content:", error);
    throw error;
  }
}

/**
 * Fetch reactions for a specific event
 */
export async function fetchReactions(eventId: string): Promise<{ count: number, userReacted: boolean }> {
  if (!eventId) {
    return { count: 0, userReacted: false };
  }

  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    const currentUser = getCurrentUser();

    // Create filter to find reaction events (kind 7) that reference this event
    const filter = {
      kinds: [NOSTR_KINDS.REACTION],
      '#e': [eventId]
    };

    const events = await pool.querySync(relayUrls, filter);
    
    // Count total reactions
    const count = events.length;
    
    // Check if current user has reacted
    let userReacted = false;
    if (currentUser) {
      userReacted = events.some(event => event.pubkey === currentUser.pubkey);
    }

    return { count, userReacted };
  } catch (error) {
    console.error(`Error fetching reactions for event ${eventId}:`, error);
    return { count: 0, userReacted: false };
  }
}

/**
 * Fetch a specific event by ID
 */
export async function fetchEventById(eventId: string) {
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();

    const filter = {
      ids: [eventId]
    };

    const events = await pool.querySync(relayUrls, filter);
    return events.length > 0 ? events[0] : null;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}

/**
 * Reply to a specific content using Nostr events
 * @param eventId - The ID of the event being replied to
 * @param authorPubkey - The pubkey of the original event author
 * @param content - The reply content
 */
export async function replyToContent(eventId: string, authorPubkey: string, content: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      throw new Error("User not logged in");
    }

    // Prepare the reply event tags
    // 'e' tag for the event we're replying to
    // 'p' tag for the author of the original event
    const tags: string[][] = [
      ["e", eventId],
      ["p", authorPubkey]
    ];

    // Determine the kind based on the content (standard note kind 1)
    const eventData = {
      kind: NOSTR_KINDS.TEXT_NOTE,
      content: content,
      tags: tags
    };

    return await publishToNostr(eventData);
  } catch (error) {
    console.error("Error replying to content:", error);
    throw error;
  }
}

/**
 * Fetch replies for a specific event
 * @param eventId - The ID of the event to fetch replies for
 */
export async function fetchReplies(eventId: string): Promise<any[]> {
  if (!eventId) {
    return [];
  }

  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    const currentUser = getCurrentUser();

    // Create filter to find text notes (kind 1) that reference this event
    const filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      '#e': [eventId]
    };

    const events = await pool.querySync(relayUrls, filter);
    
    // Process the replies
    const replies = events.map(event => {
      return {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at,
        parentId: eventId
      };
    });

    return replies;
  } catch (error) {
    console.error(`Error fetching replies for event ${eventId}:`, error);
    return [];
  }
}
