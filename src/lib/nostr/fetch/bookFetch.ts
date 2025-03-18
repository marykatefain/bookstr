import { SimplePool, type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { extractISBNFromTags, getReadingStatusFromEventKind } from "../utils/eventUtils";

/**
 * Convert a Nostr event to a Book object
 */
export function eventToBook(event: Event): Book | null {
  try {
    // Extract ISBN from tags
    const isbn = extractISBNFromTags(event);
    
    if (!isbn) {
      console.warn('Missing ISBN tag in event:', event);
      return null;
    }
    
    // Default book with required fields
    const book: Book = {
      id: event.id,
      title: "", // Will be filled in later
      author: "", // Will be filled in later
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEventKind(event.kind),
      dateAdded: event.created_at * 1000,
    };
    
    return { ...book, readingStatus };
  } catch (error) {
    console.error('Error parsing book from event:', error);
    return null;
  }
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
    // Create a filter for all book event kinds
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING,
        NOSTR_KINDS.BOOK_READ
      ],
      authors: [pubkey],
      limit: 1000 // Increased limit from default to 1000
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} book events`);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Extract book details from events and deduplicate by ISBN
    const bookEvents = events.map(event => eventToBook(event)).filter(book => book !== null) as Book[];
    const uniqueBooks = new Map<string, Book>();
    
    // Group by ISBN and keep the most recent event for each ISBN based on status
    bookEvents.forEach(book => {
      if (!book.isbn || !book.readingStatus) return;
      
      const existingBook = uniqueBooks.get(book.isbn);
      
      // If we don't have this ISBN yet, or if this event is newer than what we have
      if (!existingBook || 
          (book.readingStatus.dateAdded > (existingBook.readingStatus?.dateAdded || 0))) {
        uniqueBooks.set(book.isbn, book);
      }
    });
    
    // Now we have unique books by ISBN with the most recent status
    const dedupedBooks = Array.from(uniqueBooks.values());
    
    // Extract all unique ISBNs 
    const isbns = dedupedBooks.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0) as string[];
    
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
        dedupedBooks.forEach(book => {
          if (!book.isbn || !book.readingStatus) return;
          
          const details = bookDetailsMap.get(book.isbn);
          if (details) {
            // Merge the details while preserving the id and reading status
            Object.assign(book, {
              ...details,
              id: book.id, // Keep the original Nostr event ID
              readingStatus: book.readingStatus // Keep the reading status
            });
          }
          
          const status = book.readingStatus.status;
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
        dedupedBooks.forEach(book => {
          if (!book.readingStatus) return;
          
          const status = book.readingStatus.status;
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
      dedupedBooks.forEach(book => {
        if (!book.readingStatus) return;
        
        const status = book.readingStatus.status;
        if (status === 'reading') {
          readingBooks.push(book);
        } else if (status === 'finished') {
          readBooks.push(book);
        } else {
          tbrBooks.push(book);
        }
      });
    }
    
    console.log(`Categorized books: TBR=${tbrBooks.length}, Reading=${readingBooks.length}, Read=${readBooks.length}`);
    
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
 * Fetch a single book by ISBN
 */
export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    return null;
  }
  return getBookByISBN(isbn);
}

/**
 * Simple placeholder for backward compatibility
 */
export async function ensureBookMetadata(book: Book): Promise<string | null> {
  console.log("Book metadata is no longer needed in the simplified approach");
  return "placeholder"; // Return a non-null value to avoid errors
}
