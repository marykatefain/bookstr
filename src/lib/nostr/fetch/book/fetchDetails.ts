
import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";

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
 * Enhance books with additional details from OpenLibrary
 * While preserving the original reading status and ratings
 */
export async function enhanceBooksWithDetails(
  books: Book[], 
  isbns: string[]
): Promise<Book[]> {
  try {
    const bookDetails = await getBooksByISBN(isbns);
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Partial<Book>>();
    bookDetails.forEach(book => {
      if (book.isbn) {
        bookDetailsMap.set(book.isbn, book);
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings
    return books.map(book => {
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
    });
  } catch (error) {
    console.error('Error enhancing books with OpenLibrary data:', error);
    return books; // Return original books if enhancement fails
  }
}
