import { Book, BookActionType } from "../types";
import { getCurrentUser } from "../user";
import { getSharedPool } from "../utils/poolManager";
import { getUserRelays } from "../relay";
import { NOSTR_KINDS } from "../types";
import { publishToNostr, updateNostrEvent } from "../publish";

/**
 * Service for handling book list operations (tbr, reading, finished)
 */
export class BookListService {
  /**
   * Fetch all ISBNs from a specific list type
   */
  static async fetchExistingIsbnTags(listType: BookActionType): Promise<string[][]> {
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
    
    const pool = getSharedPool();
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
    }
  }
  
  /**
   * Add a book to the "TBR" list
   */
  static async addBookToTBR(book: Book): Promise<string | null> {
    console.log("==== Adding book to TBR ====");
    console.log("Book details:", book.title, book.author, book.isbn);
    
    if (!book.isbn) {
      console.error("Cannot add book to TBR: ISBN is missing");
      return null;
    }
    
    // First, try to fetch existing ISBN tags
    const existingTags = await this.fetchExistingIsbnTags('tbr');
    
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
  static async markBookAsReading(book: Book): Promise<string | null> {
    console.log("==== Marking book as reading ====");
    console.log("Book details:", book.title, book.author, book.isbn);
    
    if (!book.isbn) {
      console.error("Cannot mark book as reading: ISBN is missing");
      return null;
    }
    
    // First, try to fetch existing ISBN tags
    const existingTags = await this.fetchExistingIsbnTags('reading');
    
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
  static async markBookAsRead(book: Book, rating?: number): Promise<string | null> {
    console.log("==== Marking book as read ====");
    console.log("Book details:", book.title, book.author, book.isbn);
    
    if (!book.isbn) {
      console.error("Cannot mark book as read: ISBN is missing");
      return null;
    }
    
    // First, try to fetch existing ISBN tags
    const existingTags = await this.fetchExistingIsbnTags('finished');
    
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
   * Try to update an existing book in a list
   * Returns true if the update was successful, false if no existing event was found
   */
  static async updateBookInList(book: Book, listType: BookActionType): Promise<boolean> {
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
   * Remove a book from a specific list
   */
  static async removeBookFromList(book: Book, listType: BookActionType): Promise<string | null> {
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
  
  /**
   * Unified function to add a book to any of the reading lists
   */
  static async addBookToList(book: Book, listType: BookActionType): Promise<string | null> {
    console.log(`==== Adding book to ${listType} list ====`);
    
    if (!book.isbn) {
      console.error(`Cannot add book to ${listType} list: ISBN is missing`);
      return null;
    }
    
    // Try to update existing list first
    const updated = await this.updateBookInList(book, listType);
    
    // If update succeeded, we're done
    if (updated) {
      return null; // We don't have the event ID here, but the update was successful
    }
    
    // Otherwise create a new list with just this book
    switch (listType) {
      case 'tbr':
        return this.addBookToTBR(book);
      case 'reading':
        return this.markBookAsReading(book);
      case 'finished':
        return this.markBookAsRead(book);
      default:
        console.error(`Unknown list type: ${listType}`);
        return null;
    }
  }
}
