
import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { batchFetchBooksWithPlaceholders } from "./fetchUtils";
import { throttlePromises } from "@/lib/utils";

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
 * Optimized version with chunking and prioritization
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
    
    // Process ISBNs in chunks to improve performance
    const CHUNK_SIZE = 20;
    const uniqueIsbns = [...new Set(isbns)];
    
    // Prioritize visible books
    // Sort ISBNs - books in the current list should be prioritized
    const bookIsbns = books.map(book => book.isbn).filter(Boolean) as string[];
    const prioritizedIsbns = [
      ...bookIsbns,
      ...uniqueIsbns.filter(isbn => !bookIsbns.includes(isbn))
    ];
    
    // Fetch in chunks to prevent overwhelming the API
    const booksMap: Record<string, Book> = {};
    
    for (let i = 0; i < prioritizedIsbns.length; i += CHUNK_SIZE) {
      const chunk = prioritizedIsbns.slice(i, i + CHUNK_SIZE);
      const chunkMap = await batchFetchBooksWithPlaceholders(chunk);
      Object.assign(booksMap, chunkMap);
      
      // Short delay between chunks to avoid overwhelming the API
      if (i + CHUNK_SIZE < prioritizedIsbns.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
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
      // Only update fields if the new data is better than what we already have
      return {
        ...book,
        title: (details.title && details.title !== 'Unknown Title') 
          ? details.title 
          : (book.title && book.title !== 'Unknown Title') 
            ? book.title 
            : 'Unknown Title',
        author: (details.author && details.author !== 'Unknown Author') 
          ? details.author 
          : (book.author && book.author !== 'Unknown Author') 
            ? book.author 
            : 'Unknown Author',
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
