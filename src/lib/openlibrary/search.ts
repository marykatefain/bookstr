
import { Book } from "@/lib/nostr/types";
import { BASE_URL, OpenLibrarySearchResult } from './types';
import { docToBook, fetchISBNFromEditionKey } from './utils';

// Enhanced cache for search results with longer TTL
const searchCache: Record<string, { data: Book[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache (increased from 15)
const RATE_LIMIT_BACKOFF = 1000 * 60 * 15; // 15 minute backoff for rate limiting

// Track ongoing requests to prevent duplicate concurrent requests
const ongoingRequests: Record<string, Promise<Book[]>> = {};

/**
 * Search books on OpenLibrary with caching
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    // Create a cache key from query and limit
    const formattedQuery = query.trim().toLowerCase();
    const cacheKey = `${formattedQuery}-${limit}`;
    const now = Date.now();
    
    // Check cache first
    const cached = searchCache[cacheKey];
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log(`Using cached search results for "${query}"`);
      return cached.data;
    }
    
    // If there's already an ongoing request for this query, return that promise
    if (ongoingRequests[cacheKey]) {
      console.log(`Reusing ongoing request for query: "${query}"`);
      return ongoingRequests[cacheKey];
    }
    
    console.log(`Searching OpenLibrary for: "${query}" with limit ${limit}`);
    
    // Create a new request promise and store it
    const requestPromise = (async () => {
      try {
        // Use the OpenLibrary search API with proper parameters
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased from 8)
        
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
              // Update the timestamp to prevent frequent retries during rate limiting
              searchCache[cacheKey] = { 
                data: cached.data, 
                timestamp: now - CACHE_TTL + RATE_LIMIT_BACKOFF 
              };
              return cached.data;
            }
            throw new Error("Rate limited by OpenLibrary API");
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data: OpenLibrarySearchResult = await response.json();
        console.log(`OpenLibrary search returned ${data.docs?.length || 0} results for "${query}"`);
        
        // Make sure we have docs to process
        if (!data.docs || !Array.isArray(data.docs)) {
          console.error("Invalid docs in search response:", data);
          return [];
        }
        
        // Process results in parallel but with a smaller batch size for better reliability
        const processedBooks: Book[] = [];
        const batchSize = 5;
        
        for (let i = 0; i < data.docs.length; i += batchSize) {
          const batch = data.docs.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (doc) => {
              const book = docToBook(doc);
              
              // Only fetch ISBN if we don't already have one
              if (!book.isbn) {
                try {
                  // First check if we have an ISBN in the doc's isbn array
                  if (doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
                    book.isbn = doc.isbn[0];
                    if (!doc.cover_i) {
                      book.coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
                    }
                  } 
                  // If no ISBN yet and we have a cover_edition_key, try to fetch ISBN from that
                  else if (doc.cover_edition_key) {
                    try {
                      const isbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
                      if (isbn) {
                        book.isbn = isbn;
                        if (!doc.cover_i) {
                          book.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                        }
                      }
                    } catch (err) {
                      console.warn(`Failed to fetch ISBN for ${book.title} from cover_edition_key:`, err);
                    }
                  }
                  
                  // Last resort - check if we have edition_key array to try
                  if (!book.isbn && doc.edition_key && Array.isArray(doc.edition_key) && doc.edition_key.length > 0) {
                    // Try the first edition key
                    try {
                      const editionKey = doc.edition_key[0];
                      const isbn = await fetchISBNFromEditionKey(editionKey);
                      if (isbn) {
                        book.isbn = isbn;
                        if (!doc.cover_i) {
                          book.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                        }
                      }
                    } catch (err) {
                      console.warn(`Failed to fetch ISBN for ${book.title} from edition_key:`, err);
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
      } finally {
        // Clean up the ongoing request reference
        delete ongoingRequests[cacheKey];
      }
    })();
    
    // Store the promise for potential reuse
    ongoingRequests[cacheKey] = requestPromise;
    
    return await requestPromise;
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}
