
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
    console.log('Received book details from OpenLibrary:', bookDetails.map(book => ({ 
      isbn: book.isbn, 
      title: book.title || 'No Title', 
      author: book.author || 'No Author' 
    })));
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Book>();
    bookDetails.forEach(book => {
      if (book.isbn) {
        bookDetailsMap.set(book.isbn, book);
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    const enhancedBooks = books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) return book;
      
      const details = bookDetailsMap.get(book.isbn);
      if (!details) {
        console.log(`No OpenLibrary details found for book ISBN: ${book.isbn}`);
        // Return book with placeholders if needed
        return {
          ...book,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author'
        };
      }
      
      console.log(`Enhancing book ${book.isbn} with details:`, {
        originalTitle: book.title || 'None',
        newTitle: details.title || 'None',
        originalAuthor: book.author || 'None',
        newAuthor: details.author || 'None'
      });
      
      // Always use OpenLibrary data if available, regardless of whether 
      // our current data is the placeholder or not
      return {
        ...book,
        ...details, // Apply all OpenLibrary fields, but then override the ones we want to preserve
        id: book.id, // Keep the original ID
        isbn: book.isbn, // Keep the original ISBN
        title: details.title || book.title || 'Unknown Title',
        author: details.author || book.author || 'Unknown Author',
        readingStatus: book.readingStatus // Keep the reading status with rating
      };
    });
    
    console.log('Final enhanced books:', enhancedBooks.map(book => ({ 
      isbn: book.isbn, 
      title: book.title, 
      author: book.author 
    })));
    
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
