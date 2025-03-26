
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey } from './utils';
import { searchBooks } from './search';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for genre search results with increased TTL
const genreCache: Record<string, { data: Book[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 60 minutes cache for genres (increased from 30)
const RATE_LIMIT_BACKOFF = 1000 * 60 * 15; // 15 minute backoff for rate limiting

// Track ongoing requests to prevent duplicate concurrent requests
const ongoingRequests: Record<string, Promise<Book[]>> = {};

/**
 * Search books by genre/subject using the search API with rating sort
 */
export async function searchBooksByGenre(genre: string, limit: number = 20): Promise<Book[]> {
  if (!genre || genre.trim() === '') {
    return [];
  }
  
  try {
    // Create a cache key
    const formattedGenre = genre.toLowerCase();
    const cacheKey = `${formattedGenre}-${limit}`;
    const now = Date.now();
    
    // Check cache first
    const cached = genreCache[cacheKey];
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log(`Using cached genre results for "${genre}"`);
      return cached.data;
    }
    
    // If there's already an ongoing request for this genre, return that promise
    if (ongoingRequests[cacheKey]) {
      console.log(`Reusing ongoing request for genre: "${genre}"`);
      return ongoingRequests[cacheKey];
    }
    
    console.log(`Searching OpenLibrary for genre: "${genre}" with limit ${limit}`);
    
    // Create a new request promise and store it
    const requestPromise = (async () => {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased from 8)
        
        // FIX: Use /search.json in the path when searching by subject
        const response = await fetch(
          `${API_BASE_URL}/search.json?q=subject:"${encodeURIComponent(formattedGenre)}"&sort=rating&limit=${limit}`,
          {
            headers: { 'Accept': 'application/json' },
            // Use browser cache
            cache: 'default',
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
              genreCache[cacheKey] = { 
                data: cached.data, 
                timestamp: now - CACHE_TTL + RATE_LIMIT_BACKOFF 
              };
              return cached.data;
            }
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`OpenLibrary genre search returned ${data.docs?.length || 0} results for "${genre}"`);
        
        if (!data.docs || !Array.isArray(data.docs)) {
          console.error("Invalid docs in genre search response:", data);
          return [];
        }
        
        // Pre-filter docs to reduce processing on empty results
        const filteredDocs = data.docs.filter(doc => doc.isbn || doc.cover_i || doc.cover_edition_key);
        if (filteredDocs.length === 0) {
          console.log(`No valid results for genre "${genre}", using fallback`);
          const fallbackResults = await searchBooks(genre, limit);
          genreCache[cacheKey] = { data: fallbackResults, timestamp: now };
          return fallbackResults;
        }
        
        // Process results in batches to reduce concurrent requests
        const processedBooks: Book[] = [];
        const batchSize = 5;
        
        for (let i = 0; i < filteredDocs.length; i += batchSize) {
          const batch = filteredDocs.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (doc) => {
              let isbn = "";
              
              // Try to get ISBN from various possible sources
              if (doc.isbn && doc.isbn.length > 0) {
                isbn = doc.isbn[0];
              } else if (doc.cover_edition_key) {
                try {
                  const fetchedIsbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
                  if (fetchedIsbn) {
                    isbn = fetchedIsbn;
                  }
                } catch (err) {
                  // Continue without ISBN if fetching fails
                  console.warn(`Failed to fetch ISBN for genre book:`, err);
                }
              }
              
              return {
                id: doc.key || `genre-${genre}-${doc.title}-${doc.author_name?.[0] || "unknown"}`,
                title: doc.title,
                author: doc.author_name?.[0] || "Unknown Author",
                isbn: isbn,
                coverUrl: getCoverUrl(isbn, doc.cover_i),
                description: doc.description || "",
                pubDate: doc.first_publish_year?.toString() || "",
                pageCount: doc.number_of_pages_median || 0,
                categories: doc.subject?.slice(0, 3) || [genre]
              };
            })
          );
          
          processedBooks.push(...batchResults);
        }
        
        console.log(`Processed ${processedBooks.length} books from genre search results`);
        
        // Cache the results
        genreCache[cacheKey] = { data: processedBooks, timestamp: now };
        
        return processedBooks;
      } finally {
        // Clean up the ongoing request reference
        delete ongoingRequests[cacheKey];
      }
    })();
    
    // Store the promise for potential reuse
    ongoingRequests[cacheKey] = requestPromise;
    
    return await requestPromise;
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    // If genre search fails, try regular search as fallback
    console.log(`Falling back to regular search for: "${genre}"`);
    return searchBooks(genre, limit);
  }
}
