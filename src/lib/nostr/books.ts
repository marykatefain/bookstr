
import { Book, BookActionType, NOSTR_KINDS } from "./types";
import { updateNostrEvent } from "./publish";

/**
 * Helper function to fetch existing ISBN tags from a specific list
 */
const fetchExistingIsbnTags = async (listType: BookActionType): Promise<string[][]> => {
  // This is a placeholder for the actual implementation
  // In a real implementation, you would query the existing event and extract tags
  console.log(`Fetching existing ISBN tags for ${listType} list`);
  return [];
};

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
    const isbnToRemove = `isbn:${book.isbn}`;
    console.log(`Attempting to remove ISBN ${isbnToRemove} from ${listType} list`);
    
    // First, fetch the current list to check if the book is actually in it
    const currentTags = await fetchExistingIsbnTags(listType);
    const isbnExists = currentTags.some(tag => tag[1] === isbnToRemove);
    
    if (!isbnExists) {
      console.log(`ISBN ${isbnToRemove} not found in ${listType} list, nothing to remove`);
      return null;
    }
    
    // The updateNostrEvent function will try to find an existing event with the specified kind
    // If found, it updates the event by removing the specified ISBN
    const result = await updateNostrEvent(
      { kind },
      (prevTags) => {
        console.log("Previous tags before removal:", prevTags);
        
        // First, extract the exact ISBN we want to remove
        const targetIsbn = `isbn:${book.isbn}`;
        console.log(`Target ISBN to remove: ${targetIsbn}`);
        
        // Filter out the specific ISBN we want to remove
        const updatedTags = prevTags.filter(tag => {
          // For debugging
          if (tag[0] === 'i') {
            console.log(`Checking tag: ${tag[1]}, comparing with: ${targetIsbn}, equal?: ${tag[1] === targetIsbn}`);
          }
          return !(tag[0] === 'i' && tag[1] === targetIsbn);
        });
        
        console.log("Tags after filtering ISBN:", updatedTags);
        console.log(`Removed ISBN tag? ${prevTags.length !== updatedTags.length}`);
        
        // Ensure we still have the 'k' tag for isbn
        if (updatedTags.some(tag => tag[0] === 'i')) {
          // Only add k tag if it doesn't already exist
          if (!updatedTags.some(tag => tag[0] === 'k' && tag[1] === 'isbn')) {
            updatedTags.push(['k', 'isbn']);
          }
        } else {
          // If no ISBNs left, remove the 'k' tag for ISBN
          return updatedTags.filter(tag => !(tag[0] === 'k' && tag[1] === 'isbn'));
        }
        
        console.log('Final updated tags after removing ISBN:', updatedTags);
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

// Update placeholder functions with the correct parameter signatures
export const addBookToList = async (book: Book, listType: BookActionType): Promise<string | null> => {
  console.log(`Adding book to ${listType} list`);
  return null;
};

export const updateBookInList = async (book: Book, listType: BookActionType): Promise<boolean> => {
  console.log(`Updating book in ${listType} list`);
  return false;
};

// Update placeholder functions with the correct parameter signatures for all exported functions
export const addBookToTBR = async (book: Book): Promise<string | null> => {
  console.log(`Adding book to TBR list: ${book.title}`);
  return null;
};

export const markBookAsReading = async (book: Book): Promise<string | null> => {
  console.log(`Marking book as reading: ${book.title}`);
  return null;
};

export const markBookAsRead = async (book: Book): Promise<string | null> => {
  console.log(`Marking book as read: ${book.title}`);
  return null;
};

export const rateBook = async (book: Book, rating: number): Promise<string | null> => {
  console.log(`Rating book ${book.title} with ${rating} stars`);
  return null;
};

export const reviewBook = async (book: Book, review: string, rating?: number): Promise<string | null> => {
  console.log(`Reviewing book ${book.title} with rating ${rating || 'none'}`);
  return null;
};

export const reactToContent = async (contentId: string): Promise<string | null> => {
  console.log(`Reacting to content with ID: ${contentId}`);
  return null;
};

export const replyToContent = async (contentId: string, reply: string): Promise<string | null> => {
  console.log(`Replying to content with ID: ${contentId}`);
  return null;
};

export const followUser = async (pubkey: string): Promise<string | null> => {
  console.log(`Following user with pubkey: ${pubkey}`);
  return null;
};
