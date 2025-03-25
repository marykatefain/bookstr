
import { type Filter } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../../types";
import { getUserRelays } from "../../relay";
import { getSharedPool } from "../../utils/poolManager";
import { 
  eventToBook, 
  extractISBNsFromTags, 
  extractISBNFromTags 
} from "./eventUtils";
import { 
  deduplicateEvents, 
  deduplicateBooksByIsbn, 
  deduplicateBookLists 
} from "./deduplication";
import { enhanceBooksWithDetails } from "./fetchDetails";

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
    
    // Deduplicate events based on id to prevent duplicate entries from multiple relays
    const uniqueListEvents = deduplicateEvents(listEvents);
    const uniqueRatingEvents = deduplicateEvents(ratingEvents);
    
    console.log(`After deduplication: ${uniqueListEvents.length} book list events and ${uniqueRatingEvents.length} rating events`);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Process list events first
    for (const event of uniqueListEvents) {
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

    for (const event of uniqueRatingEvents) {
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
    
    // Deduplicate books within each list by ISBN
    const uniqueTbrBooks = deduplicateBooksByIsbn(tbrBooksWithRatings);
    const uniqueReadingBooks = deduplicateBooksByIsbn(readingBooksWithRatings);
    const uniqueReadBooks = deduplicateBooksByIsbn(readBooksWithRatings);
    
    console.log(`Books after internal deduplication: TBR=${uniqueTbrBooks.length}, Reading=${uniqueReadingBooks.length}, Read=${uniqueReadBooks.length}`);
    
    // Deduplicate books across lists - prioritize read > reading > tbr
    const uniqueBooksByList = deduplicateBookLists({
      tbr: uniqueTbrBooks,
      reading: uniqueReadingBooks,
      read: uniqueReadBooks
    });
    
    console.log(`After cross-list deduplication: TBR=${uniqueBooksByList.tbr.length}, Reading=${uniqueBooksByList.reading.length}, Read=${uniqueBooksByList.read.length}`);
    
    // Extract all unique ISBNs from all books
    const allBooks = [...uniqueBooksByList.tbr, ...uniqueBooksByList.reading, ...uniqueBooksByList.read];
    const isbns = allBooks.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0) as string[];
    const uniqueIsbns = [...new Set(isbns)];
    
    console.log(`Found ${uniqueIsbns.length} unique ISBNs to fetch details for`);
    
    // Fetch additional book details from OpenLibrary if we have ISBNs
    if (uniqueIsbns.length > 0) {
      try {
        // Enhance each list with OpenLibrary data
        const enhancedTbrBooks = await enhanceBooksWithDetails(uniqueBooksByList.tbr, uniqueIsbns);
        const enhancedReadingBooks = await enhanceBooksWithDetails(uniqueBooksByList.reading, uniqueIsbns);
        const enhancedReadBooks = await enhanceBooksWithDetails(uniqueBooksByList.read, uniqueIsbns);
        
        console.log(`Enhanced books: TBR=${enhancedTbrBooks.length}, Reading=${enhancedReadingBooks.length}, Read=${enhancedReadBooks.length}`);
        
        return {
          tbr: enhancedTbrBooks,
          reading: enhancedReadingBooks,
          read: enhancedReadBooks
        };
      } catch (error) {
        console.error('Error enhancing books with OpenLibrary data:', error);
        // Fall back to using basic book data without enhancements
        console.log(`Falling back to unenhanced data with ratings: TBR=${uniqueBooksByList.tbr.length}, Reading=${uniqueBooksByList.reading.length}, Read=${uniqueBooksByList.read.length}`);
        
        return uniqueBooksByList;
      }
    } else {
      // No ISBNs, just use the basic book data with ratings
      console.log(`No ISBNs found, using basic data with ratings: TBR=${uniqueBooksByList.tbr.length}, Reading=${uniqueBooksByList.reading.length}, Read=${uniqueBooksByList.read.length}`);
      
      return uniqueBooksByList;
    }
  } catch (error) {
    console.error('Error fetching books from relays:', error);
    return { tbr: [], reading: [], read: [] };
  }
}
