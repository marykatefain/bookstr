
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
    console.log(`Received ${bookDetails.length} books from OpenLibrary`);
    
    // Log received data for debugging
    bookDetails.forEach(book => {
      console.log(`OpenLibrary data for ISBN ${book.isbn}: title="${book.title}", author="${book.author}"`);
    });
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Book>();
    bookDetails.forEach(book => {
      if (book?.isbn) {
        bookDetailsMap.set(book.isbn, book);
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    const enhancedBooks = books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) {
        console.log(`Book without ISBN, keeping original data`);
        return book;
      }
      
      const details = bookDetailsMap.get(book.isbn);
      
      // If no details from OpenLibrary, return original book
      if (!details) {
        console.log(`No OpenLibrary data for ISBN ${book.isbn}, keeping original data`);
        return book;
      }
      
      // Always use the best title available
      const bestTitle = (details.title && details.title !== 'Unknown Title')
        ? details.title
        : (book.title && book.title !== 'Unknown Title')
          ? book.title
          : 'Unknown Title';
      
      // Always use the best author available
      const bestAuthor = (details.author && details.author !== 'Unknown Author')
        ? details.author
        : (book.author && book.author !== 'Unknown Author')
          ? book.author
          : 'Unknown Author';
      
      // Log the title/author decision
      console.log(`Enhanced book ${book.isbn}: title="${bestTitle}" (was "${book.title}"), author="${bestAuthor}" (was "${book.author}")`);
      
      // Create an enhanced book with the best available data
      return {
        ...book,
        title: bestTitle,
        author: bestAuthor,
        coverUrl: details.coverUrl || book.coverUrl || '',
        description: details.description || book.description || '',
        // Preserve reading status
        readingStatus: book.readingStatus
      };
    });
    
    return enhancedBooks;
    
  } catch (error) {
    console.error('Error enhancing books with OpenLibrary data:', error);
    // Return the original books if there's an error
    return books;
  }
}
