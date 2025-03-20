
import { Book } from "@/lib/nostr/types";
import { BASE_URL, OpenLibrarySearchResult } from './types';
import { docToBook, fetchISBNFromEditionKey, extractAuthorName } from './utils';

/**
 * Search books on OpenLibrary
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    console.log(`Searching OpenLibrary for: "${query}" with limit ${limit}`);
    
    // Use the OpenLibrary search API with proper parameters
    const response = await fetch(
      `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    console.log(`OpenLibrary search returned ${data.docs.length} results for "${query}"`);
    
    // Make sure we have docs to process
    if (!data.docs || !Array.isArray(data.docs)) {
      console.error("Invalid docs in search response:", data);
      return [];
    }
    
    // Log the first result to see what we're working with
    if (data.docs.length > 0) {
      console.log("Sample document:", data.docs[0]);
      console.log("Author name field:", data.docs[0].author_name);
    }
    
    // Process ALL results, not just those with covers
    const books = await Promise.all(
      data.docs.map(async (doc) => {
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
    
    // Filter books - we want to include as many results as possible
    // Only require title and author as minimum requirements
    const validBooks = books.filter(book => 
      book.title && book.author
    );
    
    console.log(`Processed ${validBooks.length} valid books from search results`);
    return validBooks;
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}
