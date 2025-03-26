
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
    
    // Create a map for quick lookup - all books including those with incomplete data
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
        console.log(`Book has no ISBN, keeping original data:`, {
          title: book.title || 'No Title',
          author: book.author || 'No Author'
        });
        return book;
      }
      
      const details = bookDetailsMap.get(book.isbn);
      if (!details) {
        console.log(`No OpenLibrary details found for book ISBN: ${book.isbn}, keeping original data:`, {
          title: book.title || 'No Title', 
          author: book.author || 'No Author'
        });
        
        return {
          ...book,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author'
        };
      }
      
      // Debug log to see what we're working with
      console.log(`Enhancing book ${book.isbn}:`, {
        originalTitle: book.title || 'None',
        newTitle: details.title || 'None',
        originalAuthor: book.author || 'None',
        newAuthor: details.author || 'None'
      });
      
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
      const enhancedBook = {
        ...book, // Start with original book to preserve all fields
        title: bestTitle,
        author: bestAuthor,
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
