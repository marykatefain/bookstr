
import { Event } from "nostr-tools";
import { Book } from "../../types";

/**
 * Deduplicate events by id
 * This prevents duplicate entries when fetching from multiple relays
 */
export function deduplicateEvents(events: Event[]): Event[] {
  const uniqueEvents = new Map<string, Event>();
  
  events.forEach(event => {
    // If event doesn't exist in map or current event is newer, add/replace it
    const existingEvent = uniqueEvents.get(event.id);
    if (!existingEvent) {
      uniqueEvents.set(event.id, event);
    }
  });
  
  return Array.from(uniqueEvents.values());
}

/**
 * Deduplicate books by ISBN within a single list
 * This prevents duplicate entries from the same source 
 */
export function deduplicateBooksByIsbn(books: Book[]): Book[] {
  const uniqueBooks = new Map<string, Book>();
  
  books.forEach(book => {
    if (!book.isbn) return; // Skip books without ISBN
    
    const existingBook = uniqueBooks.get(book.isbn);
    
    // If book doesn't exist in map or current book is newer, add/replace it
    if (!existingBook || 
        (book.readingStatus?.dateAdded && existingBook.readingStatus?.dateAdded && 
         book.readingStatus.dateAdded > existingBook.readingStatus.dateAdded)) {
      uniqueBooks.set(book.isbn, book);
    }
  });
  
  return Array.from(uniqueBooks.values());
}

/**
 * Deduplicate books across different reading lists
 * Prioritize: read > reading > tbr
 */
export function deduplicateBookLists(books: { 
  tbr: Book[], 
  reading: Book[], 
  read: Book[] 
}): { 
  tbr: Book[], 
  reading: Book[], 
  read: Book[] 
} {
  // Create sets of ISBNs for each list to track what's already been processed
  const readIsbns = new Set(books.read.map(book => book.isbn));
  const readingIsbns = new Set(books.reading.map(book => book.isbn));
  
  // Filter reading list to remove books that are already in read list
  const dedupedReading = books.reading.filter(book => {
    return book.isbn && !readIsbns.has(book.isbn);
  });
  
  // Update the reading ISBNs set after deduplication
  const updatedReadingIsbns = new Set(dedupedReading.map(book => book.isbn));
  
  // Filter tbr list to remove books that are in read or deduped reading lists
  const dedupedTbr = books.tbr.filter(book => {
    return book.isbn && !readIsbns.has(book.isbn) && !updatedReadingIsbns.has(book.isbn);
  });
  
  return {
    read: books.read,
    reading: dedupedReading,
    tbr: dedupedTbr
  };
}
