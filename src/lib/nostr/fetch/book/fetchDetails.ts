
import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { batchFetchBooksWithPlaceholders } from "./fetchUtils";

/**
 * Fetch multiple books by their ISBNs using optimized batch fetching
 */
export async function fetchBooksByISBN(isbns: string[]): Promise<Book[]> {
  const validIsbns = isbns.filter(isbn => isbn && isbn.length > 0);
  if (validIsbns.length === 0) {
    return [];
  }
  
  const booksMap = await batchFetchBooksWithPlaceholders(validIsbns);
  return Object.values(booksMap);
}

/**
 * Fetch a single book by ISBN (uses the cache if available)
 */
export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    return null;
  }
  
  const booksMap = await batchFetchBooksWithPlaceholders([isbn]);
  return booksMap[isbn] || null;
}

/**
 * Enhance books with additional details from OpenLibrary
 * While preserving the original reading status and ratings
 * 
 * Optimized to fetch all book details in a single batch operation
 */
export async function enhanceBooksWithDetails(
  books: Book[], 
  isbns: string[]
): Promise<Book[]> {
  try {
    // Early return if nothing to process
    if (books.length === 0 || isbns.length === 0) {
      return books;
    }
    
    console.log(`Enhancing ${books.length} books with OpenLibrary data for ${isbns.length} ISBNs`);
    
    // Create a map of existing books by ISBN for quick lookup
    const booksByIsbn: Record<string, Book> = {};
    for (const book of books) {
      if (book.isbn) {
        booksByIsbn[book.isbn] = book;
      }
    }
    
    // Fetch all book details in a single batch operation
    const booksMap = await batchFetchBooksWithPlaceholders(isbns);
    
    // Process all books in a single pass
    return books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) {
        return {
          ...book,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author'
        };
      }
      
      // Get the details for this book
      const details = booksMap[book.isbn];
      if (!details) {
        // Use existing data or placeholders
        return {
          ...book,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author'
        };
      }
      
      // Create an enriched book with best available data
      return {
        ...book,
        title: selectBestValue(details.title, book.title, 'Unknown Title'),
        author: selectBestValue(details.author, book.author, 'Unknown Author'),
        coverUrl: details.coverUrl || book.coverUrl || '',
        description: details.description || book.description || '',
        categories: details.categories || book.categories || [],
        pubDate: details.pubDate || book.pubDate || '',
        pageCount: details.pageCount || book.pageCount || 0,
        // Preserve reading status
        readingStatus: book.readingStatus
      };
    });
  } catch (error) {
    console.error('Error enhancing books with OpenLibrary data:', error);
    // Return the original books with placeholders for missing titles/authors
    return books.map(book => ({
      ...book,
      title: book.title || 'Unknown Title',
      author: book.author || 'Unknown Author'
    }));
  }
}

/**
 * Helper function to select the best value between two options
 */
function selectBestValue(newValue: string | undefined, oldValue: string | undefined, fallback: string): string {
  if (newValue && newValue !== fallback) return newValue;
  if (oldValue && oldValue !== fallback) return oldValue;
  return fallback;
}
