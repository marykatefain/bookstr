import { type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { getReadingStatusFromEventKind, extractRatingFromTags } from "../utils/eventUtils";
import { getSharedPool } from "../utils/poolManager";

/**
 * Extract all ISBNs from the tags of an event
 */
export function extractISBNsFromTags(event: Event): string[] {
  const isbnTags = event.tags.filter(([name, value]) => {
    if (event.kind === NOSTR_KINDS.REVIEW) {
      return name === 'd' && value?.startsWith('isbn:');
    } else {
      return name === 'i' && value?.startsWith('isbn:');
    }
  });

  return isbnTags.map(([, isbn]) => isbn.replace(/^isbn:/, ''));
}

/**
 * Extract a single ISBN from tags (used for backward compatibility)
 */
export function extractISBNFromTags(event: Event): string | null {
  return extractISBNsFromTags(event)[0] || null;
}

/**
 * Convert a Nostr event to a Book object
 */
export function eventToBook(event: Event, isbn: string): Book | null {
  try {
    if (!isbn) {
      console.warn('Missing ISBN for event:', event);
      return null;
    }
    
    // Default book with required fields
    const book: Book = {
      id: `${event.id}-${isbn}`, // Make ID unique for each book-isbn combination
      title: "", // Will be filled in later
      author: "", // Will be filled in later
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Extract rating if this is a review/rating event
    let rating;
    if (event.kind === NOSTR_KINDS.REVIEW) {
      rating = extractRatingFromTags(event);
      console.log(`Extracted rating ${rating} from event`, event);
    }
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEventKind(event.kind),
      dateAdded: event.created_at * 1000,
      rating: rating !== undefined ? rating : undefined
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
  const pool = getSharedPool();
  
  try {
    // Create filters for book event kinds and ratings
    const bookListFilter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING,
        NOSTR_KINDS.BOOK_READ
      ],
      authors: [pubkey],
      limit: 1000
    };
    
    const ratingFilter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      authors: [pubkey],
      "#k": ["isbn"],
      limit: 1000
    };
    
    // Fetch both book list events and rating events
    const listEvents = await pool.querySync(relays, bookListFilter);
    const ratingEvents = await pool.querySync(relays, ratingFilter);
    
    console.log(`Found ${listEvents.length} book list events and ${ratingEvents.length} rating events`);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Process list events first
    for (const event of listEvents) {
      const isbns = extractISBNsFromTags(event);
      
      if (isbns.length === 0) {
        console.warn(`No ISBNs found in event ${event.id}`);
        continue;
      }
      
      for (const isbn of isbns) {
        const book = eventToBook(event, isbn);
        if (!book || !book.readingStatus) continue;
        
        const status = book.readingStatus.status;
        if (status === 'reading') {
          readingBooks.push(book);
        } else if (status === 'finished') {
          readBooks.push(book);
        } else {
          tbrBooks.push(book);
        }
      }
    }
    
    // Create a map of ISBN to rating from rating events
    const ratingsMap = new Map<string, number>();

    for (const event of ratingEvents) {
      const isbn = extractISBNFromTags(event);
      if (!isbn) continue;
      
      const rating = extractRatingFromTags(event);
      if (rating !== undefined) {
        ratingsMap.set(isbn, rating);
        console.log(`Added rating ${rating} for ISBN ${isbn} to ratings map`);
      }
    }

    // Apply ratings to books
    const applyRatings = (books: Book[]): Book[] => {
      return books.map(book => {
        if (book.isbn && ratingsMap.has(book.isbn)) {
          const rating = ratingsMap.get(book.isbn);
          console.log(`Applying rating ${rating} to book ${book.title} (${book.isbn})`);
          return {
            ...book,
            readingStatus: {
              ...book.readingStatus!,
              rating
            }
          };
        }
        return book;
      });
    };
    
    const tbrBooksWithRatings = applyRatings(tbrBooks);
    const readingBooksWithRatings = applyRatings(readingBooks);
    const readBooksWithRatings = applyRatings(readBooks);
    
    console.log(`Books with ratings: TBR=${tbrBooksWithRatings.length}, Reading=${readingBooksWithRatings.length}, Read=${readBooksWithRatings.length}`);
    
    // Deduplicate books across lists - prioritize read > reading > tbr
    const uniqueBooksByList = deduplicateBookLists({
      tbr: tbrBooksWithRatings,
      reading: readingBooksWithRatings,
      read: readBooksWithRatings
    });
    
    console.log(`After deduplication: TBR=${uniqueBooksByList.tbr.length}, Reading=${uniqueBooksByList.reading.length}, Read=${uniqueBooksByList.read.length}`);
    
    // Extract all unique ISBNs from all books
    const allBooks = [...uniqueBooksByList.tbr, ...uniqueBooksByList.reading, ...uniqueBooksByList.read];
    const isbns = allBooks.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0) as string[];
    const uniqueIsbns = [...new Set(isbns)];
    
    console.log(`Found ${uniqueIsbns.length} unique ISBNs to fetch details for`);
    
    // Fetch additional book details from OpenLibrary if we have ISBNs
    if (uniqueIsbns.length > 0) {
      try {
        const bookDetails = await getBooksByISBN(uniqueIsbns);
        
        // Create a map for quick lookup
        const bookDetailsMap = new Map<string, Partial<Book>>();
        bookDetails.forEach(book => {
          if (book.isbn) {
            bookDetailsMap.set(book.isbn, book);
          }
        });
        
        // Enhance books with OpenLibrary data while preserving ratings
        const enhanceBook = (book: Book) => {
          if (!book.isbn) return book;
          
          const details = bookDetailsMap.get(book.isbn);
          if (details) {
            // Merge the details while preserving the id, reading status and rating
            return {
              ...book,
              ...details,
              id: book.id, // Keep the original ID
              isbn: book.isbn, // Keep the original ISBN
              readingStatus: book.readingStatus // Keep the reading status with rating
            };
          }
          return book;
        };
        
        // Apply enhancements to each list
        const enhancedTbrBooks = tbrBooksWithRatings.map(enhanceBook);
        const enhancedReadingBooks = readingBooksWithRatings.map(enhanceBook);
        const enhancedReadBooks = readBooksWithRatings.map(enhanceBook);
        
        console.log(`Enhanced books: TBR=${enhancedTbrBooks.length}, Reading=${enhancedReadingBooks.length}, Read=${enhancedReadBooks.length}`);
        
        return {
          tbr: enhancedTbrBooks,
          reading: enhancedReadingBooks,
          read: enhancedReadBooks
        };
      } catch (error) {
        console.error('Error enhancing books with OpenLibrary data:', error);
        // Fall back to using basic book data without enhancements
        console.log(`Falling back to unenhanced data with ratings: TBR=${tbrBooksWithRatings.length}, Reading=${readingBooksWithRatings.length}, Read=${readBooksWithRatings.length}`);
        
        return {
          tbr: tbrBooksWithRatings,
          reading: readingBooksWithRatings,
          read: readBooksWithRatings
        };
      }
    } else {
      // No ISBNs, just use the basic book data with ratings
      console.log(`No ISBNs found, using basic data with ratings: TBR=${tbrBooksWithRatings.length}, Reading=${readingBooksWithRatings.length}, Read=${readBooksWithRatings.length}`);
      
      return {
        tbr: tbrBooksWithRatings,
        reading: readingBooksWithRatings,
        read: readBooksWithRatings
      };
    }
  } catch (error) {
    console.error('Error fetching books from relays:', error);
    return { tbr: [], reading: [], read: [] };
  }
}

/**
 * Deduplicate books across different reading lists
 * Prioritize: read > reading > tbr
 */
function deduplicateBookLists(books: { 
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
