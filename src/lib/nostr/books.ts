import {
  publishToNostr,
  updateNostrEvent,
  getCurrentUser,
  isLoggedIn
} from "@/lib/nostr";
import { NOSTR_KINDS } from "@/lib/nostr/types";
import { toast } from "@/hooks/use-toast";
import { fetchEventById } from "./fetch/eventDetails";

/**
 * Add a book to the user's TBR list
 */
export async function addBookToTBR(isbn: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to add books to your list",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Adding book ${isbn} to TBR list`);

    // Create tags for the TBR event
    const tags: string[][] = [["i", `isbn:${isbn}`]];

    // Create and publish the TBR event
    const eventData = {
      kind: NOSTR_KINDS.TBR,
      content: `Want to read ${isbn}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error adding book to TBR list:", error);
    toast({
      title: "Error",
      description: "Failed to add book to TBR list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(isbn: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to update your reading status",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Marking book ${isbn} as reading`);

    // Create tags for the reading event
    const tags: string[][] = [["i", `isbn:${isbn}`]];

    // Create and publish the reading event
    const eventData = {
      kind: NOSTR_KINDS.READING,
      content: `Currently reading ${isbn}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error marking book as reading:", error);
    toast({
      title: "Error",
      description: "Failed to mark book as reading",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(isbn: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to update your reading status",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Marking book ${isbn} as read`);

    // Create tags for the read event
    const tags: string[][] = [["i", `isbn:${isbn}`]];

    // Create and publish the read event
    const eventData = {
      kind: NOSTR_KINDS.READ,
      content: `Finished reading ${isbn}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error marking book as read:", error);
    toast({
      title: "Error",
      description: "Failed to mark book as read",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Rate a book
 */
export async function rateBook(isbn: string, rating: number): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to rate books",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    if (rating < 0 || rating > 1) {
      throw new Error("Rating must be between 0 and 1");
    }

    console.log(`Rating book ${isbn} with ${rating}`);

    // Create tags for the rating event
    const tags: string[][] = [
      ["i", `isbn:${isbn}`],
      ["rating", rating.toString()]
    ];

    // Create and publish the rating event
    const eventData = {
      kind: NOSTR_KINDS.RATING,
      content: `Rated ${isbn} with ${rating}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error rating book:", error);
    toast({
      title: "Error",
      description: "Failed to rate book",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Review a book
 */
export async function reviewBook(isbn: string, review: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to review books",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Reviewing book ${isbn}`);

    // Create tags for the review event
    const tags: string[][] = [["i", `isbn:${isbn}`]];

    // Create and publish the review event
    const eventData = {
      kind: NOSTR_KINDS.REVIEW,
      content: review,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error reviewing book:", error);
    toast({
      title: "Error",
      description: "Failed to review book",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Reply to content
 */
export async function replyToContent(
  eventId: string,
  authorPubkey: string,
  content: string,
  eventKind: number = NOSTR_KINDS.TEXT_NOTE
): Promise<boolean> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to reply to content",
        variant: "destructive"
      });
      return false;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Replying to event ${eventId} with content "${content}"`);

    // Create tags for the reply event
    // Per NIP-10: e tag contains the id of the note being replied to
    // Per NIP-10: p tag contains the pubkey of the note author
    const tags: string[][] = [
      ["e", eventId, "", "root"],
      ["p", authorPubkey]
    ];

    // For non-standard event kinds (not kind 1), we should add a k tag
    if (eventKind !== NOSTR_KINDS.TEXT_NOTE) {
      tags.push(["k", eventKind.toString()]);
    }

    // Create and publish the reply event
    const eventData = {
      kind: NOSTR_KINDS.TEXT_NOTE,
      content: content,
      tags: tags
    };

    console.log("Publishing reply event:", eventData);
    const replyId = await publishToNostr(eventData);
    return replyId !== null;
  } catch (error) {
    console.error("Error replying to content:", error);
    toast({
      title: "Error",
      description: "Failed to reply to this content",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Follow a user
 */
export async function followUser(pubkeyToFollow: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Following user ${pubkeyToFollow}`);

    // Get current user's existing contact list
    const { follows } = await fetchFollowingList(currentUser.pubkey);

    // Check if already following
    if (follows.includes(pubkeyToFollow)) {
      console.log(`Already following ${pubkeyToFollow}`);
      return null;
    }

    // Add the new pubkey to the list
    const updatedFollows = [...follows, pubkeyToFollow];

    // Create the contact list event (kind 3)
    const eventData = {
      kind: NOSTR_KINDS.CONTACT_LIST,
      content: "",
      tags: updatedFollows.map(pk => ["p", pk])
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error following user:", error);
    toast({
      title: "Error",
      description: "Failed to follow user",
      variant: "destructive"
    });
    return null;
  }
}

import { fetchFollowingList } from "./fetch";

/**
 * Add a book to a custom list
 */
export async function addBookToList(listName: string, isbn: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to add books to lists",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Adding book ${isbn} to list ${listName}`);

    // Create tags for the list event
    const tags: string[][] = [
      ["d", listName], // "d" tag is the identifier for the list
      ["i", `isbn:${isbn}`]  // "i" tag for the ISBN
    ];

    // Create and publish the list event
    const eventData = {
      kind: NOSTR_KINDS.BOOK_LIST,
      content: `Added ${isbn} to ${listName}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error adding book to list:", error);
    toast({
      title: "Error",
      description: "Failed to add book to list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Update a book in a custom list (e.g., change order, add notes)
 */
export async function updateBookInList(listName: string, isbn: string, notes?: string, order?: number): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to update book in list",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Updating book ${isbn} in list ${listName}`);

    // Create tags for the list event
    const tags: string[][] = [
      ["d", listName], // "d" tag is the identifier for the list
      ["i", `isbn:${isbn}`]  // "i" tag for the ISBN
    ];

    // Add optional notes
    if (notes) {
      tags.push(["note", notes]);
    }

    // Add optional order
    if (order !== undefined) {
      tags.push(["order", order.toString()]);
    }

    // Create and publish the list event
    const eventData = {
      kind: NOSTR_KINDS.BOOK_LIST,
      content: `Updated ${isbn} in ${listName}`,
      tags: tags
    };

    const eventId = await publishToNostr(eventData);
    return eventId;
  } catch (error) {
    console.error("Error updating book in list:", error);
    toast({
      title: "Error",
      description: "Failed to update book in list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Remove a book from a custom list
 */
export async function removeBookFromList(listName: string, isbn: string): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to remove books from lists",
        variant: "destructive"
      });
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Removing book ${isbn} from list ${listName}`);

    // Define a function to update the tags, removing the specified ISBN
    const updateTags = (tags: string[][]) => {
      return tags.filter(tag => !(tag[0] === 'i' && tag[1] === `isbn:${isbn}`));
    };

    // Use the updateNostrEvent function to find and update the event
    const eventId = await updateNostrEvent(
      { kind: NOSTR_KINDS.BOOK_LIST, isbn: isbn },
      updateTags
    );

    return eventId;
  } catch (error) {
    console.error("Error removing book from list:", error);
    toast({
      title: "Error",
      description: "Failed to remove book from list",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * React to content with a "like" reaction (Kind 7)
 * Implements NIP-25: https://github.com/nostr-protocol/nips/blob/master/25.md
 */
export async function reactToContent(
  eventId: string,
  content: string = "+",
  eventKind: number = NOSTR_KINDS.TEXT_NOTE
): Promise<boolean> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to content",
        variant: "destructive"
      });
      return false;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    console.log(`Creating reaction to event ${eventId} with content "${content}"`);
    
    // Fetch the original event to get the author's pubkey
    // This is required for the p tag in the reaction
    const originalEvent = await fetchEventById(eventId);
    if (!originalEvent) {
      throw new Error("Failed to fetch the original event");
    }
    
    const eventPubkey = originalEvent.pubkey;

    // Create tags for the reaction event
    // Per NIP-25: e tag contains the id of the note being reacted to
    // Per NIP-25: p tag contains the pubkey of the note author
    const tags: string[][] = [
      ["e", eventId, "", "root"],
      ["p", eventPubkey]
    ];

    // For non-standard event kinds (not kind 1), we should add a k tag
    if (eventKind !== NOSTR_KINDS.TEXT_NOTE) {
      tags.push(["k", eventKind.toString()]);
    }

    // Create and publish the reaction event
    const eventData = {
      kind: NOSTR_KINDS.REACTION,
      content: content,
      tags: tags
    };

    console.log("Publishing reaction event:", eventData);
    const reactionId = await publishToNostr(eventData);
    return reactionId !== null;
  } catch (error) {
    console.error("Error reacting to content:", error);
    toast({
      title: "Error",
      description: "Failed to react to this content",
      variant: "destructive"
    });
    return false;
  }
}
