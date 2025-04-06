
import { Book } from "@/lib/nostr/types";
import { Rating } from "@/lib/utils/Rating";

/**
 * Utility functions for processing book feeds
 */

/**
 * Group books by their reading status
 */
export function groupBooksByStatus(books: Book[]): {
  tbr: Book[];
  reading: Book[];
  read: Book[];
} {
  const tbr: Book[] = [];
  const reading: Book[] = [];
  const read: Book[] = [];

  books.forEach(book => {
    const status = book.readingStatus?.status;
    
    if (status === 'tbr') {
      tbr.push(book);
    } else if (status === 'reading') {
      reading.push(book);
    } else if (status === 'finished') {
      read.push(book);
    }
  });

  return { tbr, reading, read };
}

/**
 * Calculate statistics for a book collection
 */
export function calculateBookStats(books: {
  tbr: Book[];
  reading: Book[];
  read: Book[];
}) {
  const totalBooks = books.tbr.length + books.reading.length + books.read.length;
  const readCount = books.read.length;
  const pagesRead = books.read.reduce((sum, book) => sum + (book.pageCount || 0), 0);
  
  const ratedBooks = books.read.filter(book => book.readingStatus?.rating !== undefined);
  
  // Convert each Rating to a fraction value before summing
  const ratingSum = ratedBooks.length > 0
    ? ratedBooks.reduce((sum, book) => {
        const rating = book.readingStatus?.rating;
        return sum + rating.fraction;
      }, 0)
    : 0;
  
  const averageRating = ratedBooks.length > 0
    ? ratingSum / ratedBooks.length
    : 0;
  
  return {
    totalBooks,
    readCount,
    pagesRead,
    averageRating,
    ratedBooksCount: ratedBooks.length
  };
}

/**
 * Find a book by ISBN across all reading lists
 */
export function findBookByISBN(
  books: { tbr: Book[]; reading: Book[]; read: Book[] },
  isbn: string | undefined
): Book | undefined {
  if (!isbn) return undefined;
  
  // Check each list for the book
  const inTbr = books.tbr.find(b => b.isbn === isbn);
  if (inTbr) return inTbr;
  
  const inReading = books.reading.find(b => b.isbn === isbn);
  if (inReading) return inReading;
  
  const inRead = books.read.find(b => b.isbn === isbn);
  if (inRead) return inRead;
  
  return undefined;
}
