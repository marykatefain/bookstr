
import { Book } from "@/lib/nostr/types";
import { BASE_URL, OpenLibrarySearchResult } from './types';
import { docToBook, fetchISBNFromEditionKey } from './utils';

// Simple cache for search results to reduce API calls
const searchCache: Record<string, { data: Book[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes cache

/**
 * Search books on OpenLibrary with caching
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    // Create a cache key from query and limit
    const cacheKey = `${query}-${limit}`;
    const now = Date.now();
    
    // Check cache first
    const cached = searchCache[cacheKey];
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log(`Using cached search results for "${query}"`);
      return cached.data;
    }
    
    console.log(`Searching OpenLibrary for: "${query}" with limit ${limit}`);
    
    // Use the OpenLibrary search API with proper parameters
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(
      `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by OpenLibrary API");
        // If we're rate limited but have cached data, return it even if expired
        if (cached) {
          console.log("Returning expired cache due to rate limiting");
          return cached.data;
        }
        throw new Error("Rate limited by OpenLibrary API");
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    console.log(`OpenLibrary search returned ${data.docs.length} results for "${query}"`);
    
    // Make sure we have docs to process
    if (!data.docs || !Array.isArray(data.docs)) {
      console.error("Invalid docs in search response:", data);
      return [];
    }
    
    // Process results in parallel but with a smaller batch size
    const processedBooks: Book[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < data.docs.length; i += batchSize) {
      const batch = data.docs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (doc) => {
          const book = docToBook(doc);
          
          // Only fetch ISBN if needed and if we have a cover_edition_key
          if (!book.isbn && doc.cover_edition_key) {
            try {
              const isbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
              if (isbn) {
                book.isbn = isbn;
                if (!doc.cover_i) {
                  book.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                }
              }
            } catch (err) {
              // Continue without ISBN if fetching fails
              console.warn(`Failed to fetch ISBN for ${book.title}:`, err);
            }
          }
          
          return book;
        })
      );
      
      processedBooks.push(...batchResults);
    }
    
    // Filter books - we want to include as many results as possible
    // Only require title and author as minimum requirements
    const validBooks = processedBooks.filter(book => 
      book.title && book.author
    );
    
    console.log(`Processed ${validBooks.length} valid books from search results`);
    
    // Cache the results
    searchCache[cacheKey] = { data: validBooks, timestamp: now };
    
    return validBooks;
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}
