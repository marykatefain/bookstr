
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
      
      // Debug log to see what titles and authors we're working with
      console.log(`Enhancing book ${book.isbn}:`, {
        originalTitle: book.title || 'None',
        newTitle: details.title || 'None',
        originalAuthor: book.author || 'None',
        newAuthor: details.author || 'None'
      });
      
      // Create an enhanced book object with OpenLibrary data
      const enhancedBook = {
        ...book, // Start with original book to preserve all fields
        title: details.title || book.title || 'Unknown Title',
        author: details.author || book.author || 'Unknown Author',
        coverUrl: details.coverUrl || book.coverUrl || '',
        description: details.description || book.description || '',
        readingStatus: book.readingStatus // Preserve reading status and rating
      };
      
      // Log the enhanced book for debugging
      console.log(`Enhanced book ${book.isbn} result:`, {
        title: enhancedBook.title,
        author: enhancedBook.author
      });
      
      return enhancedBook;
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
