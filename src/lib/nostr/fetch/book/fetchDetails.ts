
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
      title: book.title, 
      author: book.author,
      hasValidTitle: book.title && book.title !== 'Unknown Title',
      hasValidAuthor: book.author && book.author !== 'Unknown Author' 
    })));
    
    // Create a map for quick lookup
    const bookDetailsMap = new Map<string, Book>();
    bookDetails.forEach(book => {
      if (book?.isbn) {
        // Only add books with valid title and author to the map
        if (book.title && book.title !== 'Unknown Title' && 
            book.author && book.author !== 'Unknown Author') {
          bookDetailsMap.set(book.isbn, book);
        } else {
          console.log(`Skipping incomplete book details for ISBN ${book.isbn}: title="${book.title}", author="${book.author}"`);
        }
      }
    });
    
    // Enhance books with OpenLibrary data while preserving ratings and reading status
    const enhancedBooks = books.map(book => {
      // Skip books without ISBN
      if (!book.isbn) {
        console.log(`Book has no ISBN, keeping original data:`, {
          title: book.title || 'No Title',
          author: book.author || 'No Author'
        });
        return book;
      }
      
      const details = bookDetailsMap.get(book.isbn);
      if (!details) {
        console.log(`No valid OpenLibrary details found for book ISBN: ${book.isbn}, keeping original data:`, {
          title: book.title || 'No Title', 
          author: book.author || 'No Author'
        });
        
        // If the book doesn't have a title or author, try fetching it individually
        if (!book.title || book.title === 'Unknown Title' || 
            !book.author || book.author === 'Unknown Author') {
          // We'll handle this by fetching individually later
          // For now, return book with placeholders
          return {
            ...book,
            title: book.title || 'Unknown Title',
            author: book.author || 'Unknown Author'
          };
        }
        
        return book;
      }
      
      // Debug log to see what we're working with
      console.log(`Enhancing book ${book.isbn}:`, {
        originalTitle: book.title || 'None',
        newTitle: details.title || 'None',
        originalAuthor: book.author || 'None',
        newAuthor: details.author || 'None'
      });
      
      // Create an enhanced book object with OpenLibrary data
      const enhancedBook = {
        ...book, // Start with original book to preserve all fields
        title: details.title, // Use OpenLibrary title directly
        author: details.author, // Use OpenLibrary author directly
        coverUrl: details.coverUrl || book.coverUrl || '',
        description: details.description || book.description || '',
        // Explicitly preserve reading status and rating
        readingStatus: book.readingStatus
      };
      
      // Log the enhanced book for debugging
      console.log(`Enhanced book ${book.isbn} result:`, {
        title: enhancedBook.title,
        author: enhancedBook.author,
        hasValidTitle: enhancedBook.title !== 'Unknown Title',
        hasValidAuthor: enhancedBook.author !== 'Unknown Author',
        rating: enhancedBook.readingStatus?.rating
      });
      
      return enhancedBook;
    });
    
    console.log('Final enhanced books sample:', enhancedBooks.slice(0, 3).map(book => ({ 
      isbn: book.isbn, 
      title: book.title, 
      author: book.author,
      hasValidTitle: book.title !== 'Unknown Title',
      hasValidAuthor: book.author !== 'Unknown Author',
      rating: book.readingStatus?.rating
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
