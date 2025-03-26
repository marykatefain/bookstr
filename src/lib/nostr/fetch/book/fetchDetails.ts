
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
 */
export async function enhanceBooksWithDetails(
  books: Book[], 
  isbns: string[]
): Promise<Book[]> {
  try {
    console.log(`Enhancing ${books.length} books with OpenLibrary data for ${isbns.length} ISBNs`);
    
    // If no books to enhance, return early
    if (books.length === 0 || isbns.length === 0) {
      return books;
    }
    
    // Fetch detailed book data using our optimized batch fetcher
    console.log(`Fetching data from OpenLibrary for ${isbns.length} books`);
    const booksMap = await batchFetchBooksWithPlaceholders(isbns);
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    const enhancedBooks = books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) {
        return book;
      }
      
      const details = booksMap[book.isbn];
      if (!details) {
        // If no details found, ensure book has at least placeholder values
        return {
          ...book,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author'
        };
      }
      
      // Select the best title to use
      const bestTitle = (details.title && details.title !== 'Unknown Title') 
        ? details.title 
        : (book.title && book.title !== 'Unknown Title') 
          ? book.title 
          : 'Unknown Title';
      
      // Select the best author to use
      const bestAuthor = (details.author && details.author !== 'Unknown Author') 
        ? details.author 
        : (book.author && book.author !== 'Unknown Author') 
          ? book.author 
          : 'Unknown Author';
      
      // Create an enhanced book object with the best available data
      return {
        ...book, // Start with original book to preserve all fields
        title: bestTitle,
        author: bestAuthor,
        coverUrl: details.coverUrl || book.coverUrl || '',
        description: details.description || book.description || '',
        categories: details.categories || book.categories || [],
        pubDate: details.pubDate || book.pubDate || '',
        pageCount: details.pageCount || book.pageCount || 0,
        // Explicitly preserve reading status and rating
        readingStatus: book.readingStatus
      };
    });
    
    return enhancedBooks;
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
