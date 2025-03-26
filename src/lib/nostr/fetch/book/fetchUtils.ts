
import { Book } from "../../types";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { extractISBNFromTags, extractISBNsFromTags, extractRatingFromTags } from "./eventUtils";
import { Event } from "nostr-tools";

/**
 * Utility to merge book data from multiple sources
 * Prioritizes more complete data while preserving user-specific data like reading status
 */
export function mergeBookData(originalBook: Book, enrichmentData: Book): Book {
  // Choose the best title (non-empty and not "Unknown Title")
  const bestTitle = (enrichmentData.title && enrichmentData.title !== 'Unknown Title') 
    ? enrichmentData.title 
    : (originalBook.title && originalBook.title !== 'Unknown Title') 
      ? originalBook.title 
      : 'Unknown Title';
  
  // Choose the best author (non-empty and not "Unknown Author")
  const bestAuthor = (enrichmentData.author && enrichmentData.author !== 'Unknown Author') 
    ? enrichmentData.author 
    : (originalBook.author && originalBook.author !== 'Unknown Author') 
      ? originalBook.author 
      : 'Unknown Author';
  
  // Merge the data, prioritizing content fields from enrichment data
  // but preserving user-specific fields from the original
  return {
    ...originalBook,
    title: bestTitle,
    author: bestAuthor,
    coverUrl: enrichmentData.coverUrl || originalBook.coverUrl || '',
    description: enrichmentData.description || originalBook.description || '',
    categories: enrichmentData.categories || originalBook.categories || [],
    pubDate: enrichmentData.pubDate || originalBook.pubDate || '',
    pageCount: enrichmentData.pageCount || originalBook.pageCount || 0,
    // Explicitly preserve reading status from original
    readingStatus: originalBook.readingStatus,
  };
}

/**
 * Process book ratings from events and create a mapping of ISBN to rating
 */
export function createRatingsMap(ratingEvents: Event[]): Map<string, number> {
  const ratingsMap = new Map<string, number>();

  for (const event of ratingEvents) {
    const isbn = extractISBNFromTags(event);
    if (!isbn) continue;
    
    const rating = extractRatingFromTags(event);
    if (rating !== undefined) {
      ratingsMap.set(isbn, rating);
      console.log(`Added rating ${rating} for ISBN ${isbn} to ratings map`);
    }
  }

  return ratingsMap;
}

/**
 * Apply ratings to books from a ratings map
 */
export function applyRatingsToBooks(books: Book[], ratingsMap: Map<string, number>): Book[] {
  return books.map(book => {
    if (book.isbn && ratingsMap.has(book.isbn)) {
      const rating = ratingsMap.get(book.isbn);
      console.log(`Applying rating ${rating} to book ${book.title} (${book.isbn})`);
      return {
        ...book,
        readingStatus: {
          ...book.readingStatus!,
          rating
        }
      };
    }
    return book;
  });
}

/**
 * Fetch a book from OpenLibrary and ensure it has at least minimal placeholder data
 */
export async function fetchBookWithPlaceholders(isbn: string): Promise<Book> {
  try {
    const book = await getBookByISBN(isbn);
    
    if (!book) {
      // Return minimal book data if no result found
      return {
        id: `isbn:${isbn}`,
        isbn: isbn,
        title: "Unknown Title",
        author: "Unknown Author",
        coverUrl: ""
      };
    }
    
    // Ensure book has at least placeholder values
    return {
      ...book,
      title: book.title || "Unknown Title",
      author: book.author || "Unknown Author",
      coverUrl: book.coverUrl || "",
    };
  } catch (error) {
    console.error(`Error fetching book data for ISBN ${isbn}:`, error);
    
    // Return minimal book data in case of error
    return {
      id: `isbn:${isbn}`,
      isbn: isbn,
      title: "Unknown Title",
      author: "Unknown Author",
      coverUrl: ""
    };
  }
}
