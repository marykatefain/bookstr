
import { Book } from "@/lib/nostr/types";
import { BASE_URL, OpenLibrarySearchResult } from './types';
import { docToBook, fetchISBNFromEditionKey } from './utils';

/**
 * Search books on OpenLibrary
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  try {
    // Use the OpenLibrary search API with proper parameters
    const response = await fetch(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    console.log("OpenLibrary search results:", data);
    
    // Map the docs to our Book format, filtering out entries without covers
    const books = await Promise.all(
      data.docs
        .filter(doc => doc.cover_i || (doc.isbn && doc.isbn.length > 0)) // Ensure we have cover ID or ISBN
        .map(async (doc) => {
          const book = docToBook(doc);
          
          // If the book doesn't have an ISBN but has a cover_edition_key, fetch the ISBN
          if (!book.isbn && doc.cover_edition_key) {
            console.log(`Fetching ISBN for book: ${book.title} using edition key: ${doc.cover_edition_key}`);
            const isbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
            if (isbn) {
              book.isbn = isbn;
              // Update cover URL with the ISBN if we found one
              if (!doc.cover_i) {
                book.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
              }
              console.log(`Found ISBN for ${book.title}: ${isbn}`);
            }
          }
          
          return book;
        })
    );
    
    return books;
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}
