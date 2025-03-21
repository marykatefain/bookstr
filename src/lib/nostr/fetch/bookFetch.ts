
import { type Filter } from "nostr-tools";
import { NOSTR_KINDS, Book } from "../types";
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";

/**
 * Fetch books by a user
 */
export async function fetchUserBooks(pubkey: string): Promise<Book[]> {
  if (!pubkey) {
    console.error("No pubkey provided to fetchUserBooks");
    return [];
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    // Create a filter for all book-related kinds
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING,
        NOSTR_KINDS.BOOK_READ,
        NOSTR_KINDS.BOOK_RATING,
        NOSTR_KINDS.REVIEW
      ],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} book events for user: ${pubkey}`);
    
    // Extract unique ISBNs
    const books = new Map<string, Book>();
    
    for (const event of events) {
      // Find ISBN tag
      const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1].startsWith('isbn:'));
      
      if (isbnTag) {
        const isbn = isbnTag[1].replace('isbn:', '');
        
        if (!books.has(isbn)) {
          // Create a basic book entry
          books.set(isbn, {
            isbn: isbn,
            title: "Unknown Title",
            author: "Unknown Author",
            coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            status: "read"
          });
          
          // TODO: Fetch additional book metadata if needed
        }
      }
    }
    
    return Array.from(books.values());
  } catch (error) {
    console.error(`Error fetching books for user ${pubkey}:`, error);
    return [];
  }
}

/**
 * Fetch books by ISBN
 */
export async function fetchBooksByISBN(isbns: string[]): Promise<Book[]> {
  if (!isbns || isbns.length === 0) {
    console.error("No ISBNs provided to fetchBooksByISBN");
    return [];
  }
  
  try {
    const books: Book[] = [];
    
    for (const isbn of isbns) {
      const book = await fetchBookByISBN(isbn);
      if (book) {
        books.push(book);
      }
    }
    
    return books;
  } catch (error) {
    console.error("Error fetching books by ISBN:", error);
    return [];
  }
}

/**
 * Fetch a book by ISBN
 */
export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn) {
    console.error("No ISBN provided to fetchBookByISBN");
    return null;
  }
  
  try {
    // For now, create a basic book with the ISBN
    // In a real implementation, this would fetch from an API
    const book: Book = {
      isbn: isbn,
      title: "Book Title", // This would be fetched from an API
      author: "Book Author", // This would be fetched from an API
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
      status: "tbr"
    };
    
    return book;
  } catch (error) {
    console.error(`Error fetching book with ISBN ${isbn}:`, error);
    return null;
  }
}

/**
 * Ensure book metadata is available
 */
export async function ensureBookMetadata(isbn: string): Promise<Book | null> {
  return fetchBookByISBN(isbn);
}
