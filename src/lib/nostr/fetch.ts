
import { SimplePool, type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS, NostrProfile } from "./types";
import { getUserRelays } from "./relay";
import { getCurrentUser } from "./user";

/**
 * Convert a Nostr event to a Book object
 */
function eventToBook(event: Event): Book | null {
  try {
    // Find ISBN, title and author tags
    const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    const authorTag = event.tags.find(tag => tag[0] === 'author');
    
    if (!isbnTag || !titleTag || !authorTag) {
      console.warn('Missing required book tags in event:', event);
      return null;
    }
    
    const isbn = isbnTag[1]?.replace('isbn:', '') || '';
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
 * Determine reading status from event tags
 */
function getReadingStatusFromEvent(event: Event): 'tbr' | 'reading' | 'read' {
  const dTag = event.tags.find(tag => tag[0] === 'd');
  if (!dTag || !dTag[1]) return 'tbr';
  
  const status = dTag[1];
  if (status === 'reading') return 'reading';
  if (status === 'read-books') return 'read';
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
    const filters: Filter[] = [
      {
        kinds: [NOSTR_KINDS.GENERIC_LIST],
        authors: [pubkey],
        "#t": ["books"]
      }
    ];
    
    // Use the correct method to fetch events
    // The SimplePool.list() method has been replaced with SimplePool.querySync()
    const events = await pool.querySync(relays, filters);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    events.forEach(event => {
      const book = eventToBook(event);
      if (!book) return;
      
      const status = book.readingStatus?.status;
      if (status === 'reading') {
        readingBooks.push(book);
      } else if (status === 'read') {
        readBooks.push(book);
      } else {
        tbrBooks.push(book);
      }
    });
    
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
  // In a real app, you would call an external API here
  // For now, we'll just search in our mock data
  const { mockBooks } = await import('./types');
  
  return isbns
    .map(isbn => mockBooks.find(book => book.isbn === isbn))
    .filter(book => book !== undefined) as Book[];
}
