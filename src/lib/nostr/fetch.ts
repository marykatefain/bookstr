
import { SimplePool, type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS, NostrProfile } from "./types";
import { getUserRelays } from "./relay";
import { getCurrentUser } from "./user";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";

/**
 * Extract ISBN from a tag or reference
 */
function extractISBNFromTags(event: Event): string | null {
  // First check for direct ISBN tag
  const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  if (isbnTag && isbnTag[1]) {
    return isbnTag[1].replace('isbn:', '');
  }
  
  // If no direct ISBN tag, look for a reference to metadata event
  const refTag = event.tags.find(tag => tag[0] === 'r' && tag[1]?.startsWith('naddr'));
  if (refTag && refTag[1]) {
    // For now, we'll need to find the corresponding metadata event
    // In a real implementation, we would fetch the referenced event and extract the ISBN
    // This is a placeholder for that functionality
    console.log("Found reference tag, would fetch:", refTag[1]);
    return null;
  }
  
  return null;
}

/**
 * Convert a Nostr event to a Book object
 */
function eventToBook(event: Event): Book | null {
  try {
    // Find title and author tags
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    const authorTag = event.tags.find(tag => tag[0] === 'author');
    
    // Extract ISBN from tags or references
    const isbn = extractISBNFromTags(event);
    
    if (!isbn || !titleTag || !authorTag) {
      console.warn('Missing required book tags in event:', event);
      return null;
    }
    
    const title = titleTag[1] || '';
    const author = authorTag[1] || '';
    
    // Default book with required fields
    const book: Book = {
      id: event.id,
      title,
      author,
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEvent(event),
      dateAdded: event.created_at * 1000,
    };
    
    return { ...book, readingStatus };
  } catch (error) {
    console.error('Error parsing book from event:', error);
    return null;
  }
}

/**
 * Find or create book metadata from NIP-73 events
 */
async function findBookMetadata(isbn: string): Promise<Event | null> {
  if (!isbn) {
    console.error("Cannot find book metadata: ISBN is missing");
    return null;
  }

  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    console.log("Searching for book metadata with ISBN:", isbn);
    
    // Query for existing book metadata
    const filter: Filter = {
      kinds: [NOSTR_KINDS.BOOK_METADATA],
      "#i": [`isbn:${isbn}`],
      limit: 5
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} metadata events for ISBN:${isbn}`);
    
    // Return first found event or null
    return events.length > 0 ? events[0] : null;
  } catch (error) {
    console.error('Error finding book metadata:', error);
    return null;
  } finally {
    pool.close(relays);
  }
}

/**
 * Determine reading status from event tags
 */
function getReadingStatusFromEvent(event: Event): 'tbr' | 'reading' | 'finished' {
  const dTag = event.tags.find(tag => tag[0] === 'd');
  if (!dTag || !dTag[1]) return 'tbr';
  
  const status = dTag[1];
  if (status === 'reading') return 'reading';
  if (status === 'read' || status === 'finished') return 'finished';
  return 'tbr';
}

/**
 * Fetch user's books from relays
 */
export async function fetchUserBooks(pubkey: string): Promise<{
  tbr: Book[],
  reading: Book[],
  read: Book[]
}> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    // Create a single Filter object instead of an array
    const filter: Filter = {
      kinds: [NOSTR_KINDS.GENERIC_LIST],
      authors: [pubkey],
      "#t": ["books"]
    };
    
    // Pass a single Filter object to querySync
    const events = await pool.querySync(relays, filter);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Extract book details and references from events
    const bookEvents = events.map(event => eventToBook(event)).filter(book => book !== null) as Book[];
    const isbns = bookEvents.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0);
    
    // Fetch additional book details from OpenLibrary if we have ISBNs
    if (isbns.length > 0) {
      try {
        const bookDetails = await getBooksByISBN(isbns);
        
        // Create a map for quick lookup
        const bookDetailsMap = new Map<string, Partial<Book>>();
        bookDetails.forEach(book => {
          if (book.isbn) {
            bookDetailsMap.set(book.isbn, book);
          }
        });
        
        // Enhance books with OpenLibrary data
        bookEvents.forEach(book => {
          const details = bookDetailsMap.get(book.isbn);
          if (details) {
            // Merge the details while preserving the id and reading status
            Object.assign(book, {
              ...details,
              id: book.id, // Keep the original Nostr event ID
              readingStatus: book.readingStatus // Keep the reading status
            });
          }
          
          const status = book.readingStatus?.status;
          if (status === 'reading') {
            readingBooks.push(book);
          } else if (status === 'finished') {
            readBooks.push(book);
          } else {
            tbrBooks.push(book);
          }
        });
      } catch (error) {
        console.error('Error enhancing books with OpenLibrary data:', error);
        // Fall back to using basic book data without enhancements
        bookEvents.forEach(book => {
          const status = book.readingStatus?.status;
          if (status === 'reading') {
            readingBooks.push(book);
          } else if (status === 'finished') {
            readBooks.push(book);
          } else {
            tbrBooks.push(book);
          }
        });
      }
    } else {
      // No ISBNs, just use the basic book data
      bookEvents.forEach(book => {
        const status = book.readingStatus?.status;
        if (status === 'reading') {
          readingBooks.push(book);
        } else if (status === 'finished') {
          readBooks.push(book);
        } else {
          tbrBooks.push(book);
        }
      });
    }
    
    return {
      tbr: tbrBooks,
      reading: readingBooks,
      read: readBooks
    };
  } catch (error) {
    console.error('Error fetching books from relays:', error);
    return { tbr: [], reading: [], read: [] };
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch multiple books by their ISBNs
 */
export async function fetchBooksByISBN(isbns: string[]): Promise<Book[]> {
  const validIsbns = isbns.filter(isbn => isbn && isbn.length > 0);
  if (validIsbns.length === 0) {
    return [];
  }
  return getBooksByISBN(validIsbns);
}

/**
 * Check if book metadata exists and create it if not
 */
export async function ensureBookMetadata(book: Book): Promise<string | null> {
  if (!book.isbn) {
    console.error("Cannot ensure book metadata: ISBN is missing");
    return null;
  }

  console.log("Ensuring metadata for book:", book.title, "with ISBN:", book.isbn);
  
  // First check if metadata already exists
  const metadata = await findBookMetadata(book.isbn);
  
  if (metadata) {
    console.log("Found existing book metadata with ID:", metadata.id);
    return metadata.id;
  }
  
  console.log("No existing metadata found, creating new metadata event");
  // If no metadata exists, publish it
  const { publishBookMetadata } = await import('./books');
  const metadataId = await publishBookMetadata(book);
  
  if (metadataId) {
    console.log("Created new book metadata with ID:", metadataId);
  } else {
    console.error("Failed to create book metadata");
  }
  
  return metadataId;
}
