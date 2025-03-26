
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
    console.log(`Enhancing ${books.length} books with OpenLibrary data for ${isbns.length} ISBNs`);
    
    // If no books to enhance, return early
    if (books.length === 0 || isbns.length === 0) {
      return books;
    }
    
    // Fetch detailed book data from OpenLibrary
    console.log(`Fetching data from OpenLibrary for ${isbns.length} books`);
    const bookDetails = await getBooksByISBN(isbns);
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Book>();
    bookDetails.forEach(book => {
      if (book?.isbn) {
        bookDetailsMap.set(book.isbn, book);
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    return books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) {
        return book;
      }
      
      const details = bookDetailsMap.get(book.isbn);
      if (!details) {
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
        // Explicitly preserve reading status and rating
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
