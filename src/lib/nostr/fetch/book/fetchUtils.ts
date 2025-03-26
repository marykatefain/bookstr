
import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { extractISBNFromTags, extractISBNsFromTags, extractRatingFromTags } from "./eventUtils";
import { Event } from "nostr-tools";

// Cache for book data from OpenLibrary to prevent redundant API calls
const bookDataCache: Record<string, { data: Book, timestamp: number }> = {};
const BOOK_CACHE_TTL = 1000 * 60 * 60; // 60 minutes cache

/**
 * Utility to merge book data from multiple sources
 * Prioritizes more complete data while preserving user-specific data like reading status
 */
export function mergeBookData(originalBook: Book, enrichmentData: Book): Book {
  // Choose the best title (non-empty and not "Unknown Title")
  const bestTitle = (enrichmentData.title && enrichmentData.title !== 'Unknown Title') 
    ? enrichmentData.title 
    : (originalBook.title && originalBook.title !== 'Unknown Title') 
      ? originalBook.title 
      : 'Unknown Title';
  
  // Choose the best author (non-empty and not "Unknown Author")
  const bestAuthor = (enrichmentData.author && enrichmentData.author !== 'Unknown Author') 
    ? enrichmentData.author 
    : (originalBook.author && originalBook.author !== 'Unknown Author') 
      ? originalBook.author 
      : 'Unknown Author';
  
  // Merge the data, prioritizing content fields from enrichment data
  // but preserving user-specific fields from the original
  return {
    ...originalBook,
    title: bestTitle,
    author: bestAuthor,
    coverUrl: enrichmentData.coverUrl || originalBook.coverUrl || '',
    description: enrichmentData.description || originalBook.description || '',
    categories: enrichmentData.categories || originalBook.categories || [],
    pubDate: enrichmentData.pubDate || originalBook.pubDate || '',
    pageCount: enrichmentData.pageCount || originalBook.pageCount || 0,
    // Explicitly preserve reading status from original
    readingStatus: originalBook.readingStatus,
  };
}

/**
 * Process book ratings from events and create a mapping of ISBN to rating
 */
export function createRatingsMap(ratingEvents: Event[]): Map<string, number> {
  const ratingsMap = new Map<string, number>();

  for (const event of ratingEvents) {
    const isbn = extractISBNFromTags(event);
    if (!isbn) continue;
    
    const rating = extractRatingFromTags(event);
    if (rating !== undefined) {
      ratingsMap.set(isbn, rating);
    }
  }

  return ratingsMap;
}

/**
 * Apply ratings to books from a ratings map
 */
export function applyRatingsToBooks(books: Book[], ratingsMap: Map<string, number>): Book[] {
  return books.map(book => {
    if (book.isbn && ratingsMap.has(book.isbn)) {
      const rating = ratingsMap.get(book.isbn);
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
}

/**
 * Fetch a book from OpenLibrary with caching and ensure it has at least minimal placeholder data
 */
export async function fetchBookWithPlaceholders(isbn: string): Promise<Book> {
  try {
    // Check cache first
    const now = Date.now();
    const cacheKey = `isbn:${isbn}`;
    
    if (bookDataCache[cacheKey] && (now - bookDataCache[cacheKey].timestamp < BOOK_CACHE_TTL)) {
      console.log(`Using cached book data for ISBN ${isbn}`);
      return bookDataCache[cacheKey].data;
    }
    
    const book = await getBookByISBN(isbn);
    
    if (!book) {
      // Return minimal book data if no result found
      const placeholderBook = {
        id: `isbn:${isbn}`,
        isbn: isbn,
        title: "Unknown Title",
        author: "Unknown Author",
        coverUrl: ""
      };
      
      // Cache even placeholder data to prevent repeated failed lookups
      bookDataCache[cacheKey] = { data: placeholderBook, timestamp: now };
      
      return placeholderBook;
    }
    
    // Ensure book has at least placeholder values
    const completeBook = {
      ...book,
      title: book.title || "Unknown Title",
      author: book.author || "Unknown Author",
      coverUrl: book.coverUrl || "",
    };
    
    // Cache the book data
    bookDataCache[cacheKey] = { data: completeBook, timestamp: now };
    
    return completeBook;
  } catch (error) {
    console.error(`Error fetching book data for ISBN ${isbn}:`, error);
    
    // Return minimal book data in case of error
    return {
      id: `isbn:${isbn}`,
      isbn: isbn,
      title: "Unknown Title",
      author: "Unknown Author",
      coverUrl: ""
    };
  }
}

/**
 * Batch fetch books from OpenLibrary with caching to reduce API calls
 */
export async function batchFetchBooksWithPlaceholders(isbns: string[]): Promise<Record<string, Book>> {
  const now = Date.now();
  const result: Record<string, Book> = {};
  const isbnsToFetch: string[] = [];
  
  // Check which books we need to fetch and which we can get from cache
  for (const isbn of isbns) {
    const cacheKey = `isbn:${isbn}`;
    if (bookDataCache[cacheKey] && (now - bookDataCache[cacheKey].timestamp < BOOK_CACHE_TTL)) {
      // Use cached book
      result[isbn] = bookDataCache[cacheKey].data;
    } else {
      // Need to fetch this book
      isbnsToFetch.push(isbn);
    }
  }
  
  // If we have books to fetch, get them all at once
  if (isbnsToFetch.length > 0) {
    try {
      console.log(`Batch fetching ${isbnsToFetch.length} books`);
      const fetchedBooks = await getBooksByISBN(isbnsToFetch);
      
      // Create a map for quick lookup
      const fetchedBooksMap: Record<string, Book> = {};
      for (const book of fetchedBooks) {
        if (book.isbn) {
          fetchedBooksMap[book.isbn] = {
            ...book,
            title: book.title || "Unknown Title",
            author: book.author || "Unknown Author",
            coverUrl: book.coverUrl || "",
          };
          
          // Update cache
          const cacheKey = `isbn:${book.isbn}`;
          bookDataCache[cacheKey] = { data: fetchedBooksMap[book.isbn], timestamp: now };
        }
      }
      
      // Add fetched books to result and create placeholders for missing ones
      for (const isbn of isbnsToFetch) {
        if (fetchedBooksMap[isbn]) {
          result[isbn] = fetchedBooksMap[isbn];
        } else {
          // Create placeholder for books that weren't found
          const placeholderBook = {
            id: `isbn:${isbn}`,
            isbn: isbn,
            title: "Unknown Title",
            author: "Unknown Author",
            coverUrl: ""
          };
          
          result[isbn] = placeholderBook;
          
          // Cache placeholder to prevent repeated lookups
          const cacheKey = `isbn:${isbn}`;
          bookDataCache[cacheKey] = { data: placeholderBook, timestamp: now };
        }
      }
    } catch (error) {
      console.error(`Error batch fetching books:`, error);
      
      // Create placeholders for all books that we failed to fetch
      for (const isbn of isbnsToFetch) {
        if (!result[isbn]) {
          result[isbn] = {
            id: `isbn:${isbn}`,
            isbn: isbn,
            title: "Unknown Title", 
            author: "Unknown Author",
            coverUrl: ""
          };
        }
      }
    }
  }
  
  return result;
}
