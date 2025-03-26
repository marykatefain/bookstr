
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
    
    // Filter out only the books with missing data
    const booksNeedingDetails = books.filter(book => !book.title || !book.author || book.title === 'Unknown Title' || book.author === 'Unknown Author');
    const isbnsNeedingDetails = booksNeedingDetails.map(book => book.isbn).filter(Boolean);
    
    if (isbnsNeedingDetails.length === 0) {
      console.log('All books already have complete data, skipping OpenLibrary fetch');
      return books;
    }
    
    console.log(`Fetching data for ${isbnsNeedingDetails.length} books with missing details`);
    const bookDetails = await getBooksByISBN(isbns);
    console.log('Received book details from OpenLibrary:', bookDetails.map(book => ({ isbn: book.isbn, title: book.title, author: book.author })));
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Partial<Book>>();
    bookDetails.forEach(book => {
      if (book.isbn) {
        bookDetailsMap.set(book.isbn, book);
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    return books.map(book => {
      if (!book.isbn) return book;
      
      const details = bookDetailsMap.get(book.isbn);
      if (details) {
        console.log(`Enhancing book ${book.isbn} with details:`, {
          originalTitle: book.title,
          newTitle: details.title,
          originalAuthor: book.author,
          newAuthor: details.author
        });
        
        // Only use OpenLibrary data if our current data is missing or placeholder
        const shouldUpdateTitle = !book.title || book.title === 'Unknown Title';
        const shouldUpdateAuthor = !book.author || book.author === 'Unknown Author';
        
        // Merge the details while preserving the id, reading status and rating
        return {
          ...book,
          ...details,
          id: book.id, // Keep the original ID
          isbn: book.isbn, // Keep the original ISBN
          title: shouldUpdateTitle ? (details.title || 'Unknown Title') : book.title,
          author: shouldUpdateAuthor ? (details.author || 'Unknown Author') : book.author,
          readingStatus: book.readingStatus // Keep the reading status with rating
        };
      }
      
      // If no details found, ensure we have at least placeholder title/author
      return {
        ...book,
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author'
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
