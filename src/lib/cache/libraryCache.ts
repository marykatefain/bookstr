
/**
 * Library caching utility to store book data in browser storage
 */

import { Book } from "@/lib/nostr/types";

// Cache TTL in milliseconds - extended to 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Cache keys
const LIBRARY_CACHE_KEY = "bookstr_library_cache";
const LIBRARY_CACHE_TIMESTAMP_KEY = "bookstr_library_cache_timestamp";
const BOOK_DETAILS_CACHE_KEY = "bookstr_book_details_cache";

interface LibraryCache {
  tbr: Book[];
  reading: Book[];
  read: Book[];
  timestamp: number;
}

interface BookDetailsCache {
  [isbn: string]: {
    book: Book;
    timestamp: number;
  };
}

/**
 * Save library books to browser cache
 */
export function cacheLibraryBooks(books: { tbr: Book[]; reading: Book[]; read: Book[] }): void {
  try {
    // Filter out books without titles to prevent caching incomplete data
    const filteredBooks = {
      tbr: books.tbr.filter(book => book.title && book.author),
      reading: books.reading.filter(book => book.title && book.author),
      read: books.read.filter(book => book.title && book.author),
    };
    
    const cacheData: LibraryCache = {
      ...filteredBooks,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(LIBRARY_CACHE_TIMESTAMP_KEY, cacheData.timestamp.toString());
    
    console.log(`Cached ${filteredBooks.tbr.length + filteredBooks.reading.length + filteredBooks.read.length} library books`);
    
    // Also cache individual book details
    cacheBookDetails([...filteredBooks.tbr, ...filteredBooks.reading, ...filteredBooks.read]);
  } catch (error) {
    console.error("Error caching library books:", error);
  }
}

/**
 * Cache individual book details for faster retrieval
 */
export function cacheBookDetails(books: Book[]): void {
  try {
    let bookDetailsCache: BookDetailsCache = {};
    
    // Get existing cache
    const existingCache = localStorage.getItem(BOOK_DETAILS_CACHE_KEY);
    if (existingCache) {
      bookDetailsCache = JSON.parse(existingCache);
    }
    
    // Add new books to cache, but only if they have title and author
    const now = Date.now();
    let updatedCount = 0;
    
    books.forEach(book => {
      if (book && book.isbn && book.title && book.author) {
        bookDetailsCache[book.isbn] = {
          book: book,
          timestamp: now
        };
        updatedCount++;
      }
    });
    
    localStorage.setItem(BOOK_DETAILS_CACHE_KEY, JSON.stringify(bookDetailsCache));
    console.log(`Updated ${updatedCount} books in details cache`);
  } catch (error) {
    console.error("Error caching book details:", error);
  }
}

/**
 * Cache a single book's details
 */
export function cacheBookDetail(book: Book): void {
  if (!book || !book.isbn) return;
  
  // Don't cache books without title or author
  if (!book.title || !book.author) {
    console.warn(`Skipping cache for incomplete book data: ISBN=${book.isbn}`);
    return;
  }
  
  try {
    let bookDetailsCache: BookDetailsCache = {};
    
    // Get existing cache
    const existingCache = localStorage.getItem(BOOK_DETAILS_CACHE_KEY);
    if (existingCache) {
      bookDetailsCache = JSON.parse(existingCache);
    }
    
    // Add book to cache
    bookDetailsCache[book.isbn] = {
      book: book,
      timestamp: Date.now()
    };
    
    localStorage.setItem(BOOK_DETAILS_CACHE_KEY, JSON.stringify(bookDetailsCache));
    console.log(`Cached details for book ${book.title} (${book.isbn})`);
  } catch (error) {
    console.error("Error caching book detail:", error);
  }
}

/**
 * Get library books from browser cache if valid
 */
export function getCachedLibraryBooks(): { tbr: Book[]; reading: Book[]; read: Book[] } | null {
  try {
    const cachedDataString = localStorage.getItem(LIBRARY_CACHE_KEY);
    if (!cachedDataString) return null;
    
    const cachedData = JSON.parse(cachedDataString) as LibraryCache;
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cachedData.timestamp > CACHE_TTL) {
      console.log("Library cache expired, will fetch fresh data");
      return null;
    }
    
    // Validate the books have title and author
    const validBooks = {
      tbr: cachedData.tbr.filter(book => book.title && book.author),
      reading: cachedData.reading.filter(book => book.title && book.author),
      read: cachedData.read.filter(book => book.title && book.author)
    };
    
    console.log(`Using cached library data with ${validBooks.tbr.length + validBooks.reading.length + validBooks.read.length} valid books`);
    return validBooks;
  } catch (error) {
    console.error("Error retrieving cached library books:", error);
    return null;
  }
}

/**
 * Get single book by ISBN from cache
 */
export function getCachedBookByISBN(isbn: string): Book | null {
  if (!isbn) return null;
  
  try {
    // First try book details cache for faster lookup
    const bookDetailsCache = localStorage.getItem(BOOK_DETAILS_CACHE_KEY);
    if (bookDetailsCache) {
      const detailsCache = JSON.parse(bookDetailsCache) as BookDetailsCache;
      const cachedBook = detailsCache[isbn];
      
      if (cachedBook && Date.now() - cachedBook.timestamp < CACHE_TTL) {
        const book = cachedBook.book;
        // Verify the book has title and author
        if (book.title && book.author) {
          console.log(`Found valid book ${isbn} in book details cache: ${book.title} by ${book.author}`);
          return book;
        } else {
          console.log(`Found book ${isbn} in cache but it had incomplete data`);
        }
      }
    }
    
    // Fallback to library cache
    const cachedBooks = getCachedLibraryBooks();
    if (!cachedBooks) return null;
    
    // Check in read books first (priority order)
    const readBook = cachedBooks.read.find(book => book.isbn === isbn);
    if (readBook && readBook.title && readBook.author) return readBook;
    
    // Then in reading books
    const readingBook = cachedBooks.reading.find(book => book.isbn === isbn);
    if (readingBook && readingBook.title && readingBook.author) return readingBook;
    
    // Finally in tbr books
    const tbrBook = cachedBooks.tbr.find(book => book.isbn === isbn);
    if (tbrBook && tbrBook.title && tbrBook.author) return tbrBook;
    
    return null;
  } catch (error) {
    console.error("Error getting cached book by ISBN:", error);
    return null;
  }
}

/**
 * Clear library cache (useful after updates)
 */
export function clearLibraryCache(): void {
  try {
    localStorage.removeItem(LIBRARY_CACHE_KEY);
    localStorage.removeItem(LIBRARY_CACHE_TIMESTAMP_KEY);
    console.log("Library cache cleared");
  } catch (error) {
    console.error("Error clearing library cache:", error);
  }
}

/**
 * Clear book details cache
 */
export function clearBookDetailsCache(): void {
  try {
    localStorage.removeItem(BOOK_DETAILS_CACHE_KEY);
    console.log("Book details cache cleared");
  } catch (error) {
    console.error("Error clearing book details cache:", error);
  }
}
