import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { extractISBNFromTags, extractISBNsFromTags, extractRatingFromTags } from "./eventUtils";
import { Event } from "nostr-tools";

// Improved cache with longer TTL and better key structure
const bookDataCache: Record<string, { data: Book, timestamp: number }> = {};
const BOOK_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours cache (increased from 1 hour)

// Track ongoing fetch requests to prevent duplicate calls
const ongoingFetches: Record<string, Promise<Book>> = {};

/**
 * Utility to merge book data from multiple sources
 * Optimized to minimize object creation and property checks
 */
export function mergeBookData(originalBook: Book, enrichmentData: Book): Book {
  // For fields that need "Unknown" fallbacks and best-value selection
  const bestTitle = getPreferredValue(
    enrichmentData.title, 
    originalBook.title, 
    'Unknown Title'
  );
  
  const bestAuthor = getPreferredValue(
    enrichmentData.author, 
    originalBook.author, 
    'Unknown Author'
  );
  
  // For simple fallback fields
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

// Helper function to select the best available value
function getPreferredValue(newValue: string | undefined, oldValue: string | undefined, fallback: string): string {
  if (newValue && newValue !== fallback) return newValue;
  if (oldValue && oldValue !== fallback) return oldValue;
  return fallback;
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
 * Apply ratings to books from a ratings map - optimized version
 */
export function applyRatingsToBooks(books: Book[], ratingsMap: Map<string, number>): Book[] {
  // If there are no ratings, return books unchanged
  if (ratingsMap.size === 0) return books;
  
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
 * Optimized to use shared ongoing requests
 */
export async function fetchBookWithPlaceholders(isbn: string): Promise<Book> {
  if (!isbn || isbn.trim() === '') {
    return createPlaceholderBook(isbn);
  }
  
  try {
    // Check cache first
    const now = Date.now();
    const cacheKey = `isbn:${isbn}`;
    
    if (bookDataCache[cacheKey] && (now - bookDataCache[cacheKey].timestamp < BOOK_CACHE_TTL)) {
      return bookDataCache[cacheKey].data;
    }
    
    // If we already have an ongoing fetch for this ISBN, return that promise
    if (ongoingFetches[isbn]) {
      return ongoingFetches[isbn];
    }
    
    // Create a new fetch promise and store it
    const fetchPromise = (async () => {
      try {
        const book = await getBookByISBN(isbn);
        
        if (!book) {
          const placeholderBook = createPlaceholderBook(isbn);
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
      } finally {
        // Remove the ongoing fetch
        delete ongoingFetches[isbn];
      }
    })();
    
    // Store the promise for reuse
    ongoingFetches[isbn] = fetchPromise;
    
    return await fetchPromise;
  } catch (error) {
    console.error(`Error fetching book data for ISBN ${isbn}:`, error);
    return createPlaceholderBook(isbn);
  }
}

// Helper to create placeholder book
function createPlaceholderBook(isbn: string): Book {
  return {
    id: `isbn:${isbn}`,
    isbn: isbn,
    title: "Unknown Title",
    author: "Unknown Author",
    coverUrl: ""
  };
}

/**
 * Batch fetch books from OpenLibrary with caching to reduce API calls
 * Optimized to process books in parallel and reduce redundant operations
 */
export async function batchFetchBooksWithPlaceholders(isbns: string[]): Promise<Record<string, Book>> {
  // Validate and deduplicate ISBNs
  const uniqueIsbns = [...new Set(isbns.filter(isbn => isbn && isbn.length > 0))];
  if (uniqueIsbns.length === 0) {
    return {};
  }
  
  const now = Date.now();
  const result: Record<string, Book> = {};
  const isbnsToFetch: string[] = [];
  
  // First pass: Check which books we need to fetch and which we can get from cache
  for (const isbn of uniqueIsbns) {
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
      
      // Process fetched books
      for (const book of fetchedBooks) {
        if (book.isbn) {
          const completeBook = {
            ...book,
            title: book.title || "Unknown Title",
            author: book.author || "Unknown Author",
            coverUrl: book.coverUrl || "",
          };
          
          result[book.isbn] = completeBook;
          
          // Update cache
          const cacheKey = `isbn:${book.isbn}`;
          bookDataCache[cacheKey] = { data: completeBook, timestamp: now };
          
          // Remove from isbnsToFetch
          const index = isbnsToFetch.indexOf(book.isbn);
          if (index !== -1) {
            isbnsToFetch.splice(index, 1);
          }
        }
      }
      
      // Create placeholders for books that weren't found
      for (const isbn of isbnsToFetch) {
        const placeholderBook = createPlaceholderBook(isbn);
        result[isbn] = placeholderBook;
        
        // Cache placeholder
        const cacheKey = `isbn:${isbn}`;
        bookDataCache[cacheKey] = { data: placeholderBook, timestamp: now };
      }
    } catch (error) {
      console.error(`Error batch fetching books:`, error);
      
      // Create placeholders for all books that we failed to fetch
      for (const isbn of isbnsToFetch) {
        if (!result[isbn]) {
          result[isbn] = createPlaceholderBook(isbn);
        }
      }
    }
  }
  
  return result;
}
