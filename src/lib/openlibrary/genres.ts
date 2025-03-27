import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey, docToBook } from './utils';
import { searchBooks } from './search';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for genre search results with increased TTL
const genreCache: Record<string, { data: Book[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 60 minutes cache for genres (increased from 30)
const RATE_LIMIT_BACKOFF = 1000 * 60 * 15; // 15 minute backoff for rate limiting

// Track ongoing requests to prevent duplicate concurrent requests
const ongoingRequests: Record<string, Promise<Book[]>> = {};

// Calculate the minimum publication year for the 5-year filter
const CURRENT_YEAR = new Date().getFullYear();
const MIN_PUB_YEAR = CURRENT_YEAR - 5;

/**
 * Search books by genre/subject using the search API with rating sort
 * Note: This version doesn't support quickMode - the search.ts version is preferred
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
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Use /subjects endpoint with sort=new to prioritize newer books
        const response = await fetch(
          `${API_BASE_URL}/subjects/${encodeURIComponent(formattedGenre)}.json?limit=${limit * 2}&sort=new`,
          {
            headers: { 'Accept': 'application/json' },
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
        console.log(`OpenLibrary genre search returned ${data.works?.length || 0} results for "${genre}"`);
        
        if (!data.works || !Array.isArray(data.works)) {
          console.error("Invalid works in genre search response:", data);
          return searchBooks(genre, limit); // Fallback to regular search
        }
        
        // Filter works by publication year and availability of complete data
        const filteredWorks = data.works
          .filter(work => {
            // Keep books with a recent publication year (or with cover and ISBN)
            const pubYear = work.first_publish_year || 0;
            return pubYear >= MIN_PUB_YEAR || 
                  (work.cover_id && work.availability?.isbn);
          })
          .sort((a, b) => {
            // Prioritize books with complete data
            const aComplete = Boolean(a.availability?.isbn && a.cover_id);
            const bComplete = Boolean(b.availability?.isbn && b.cover_id);
            
            if (aComplete && !bComplete) return -1;
            if (!aComplete && bComplete) return 1;
            
            // Then prioritize recent books
            const aYear = a.first_publish_year || 0;
            const bYear = b.first_publish_year || 0;
            return bYear - aYear;
          });
        
        // Get final books with limit applied
        const finalWorks = filteredWorks.slice(0, limit);
        
        // If we have no valid results after filtering, fall back to search
        if (finalWorks.length === 0) {
          console.log(`No valid results for genre "${genre}" after filtering, using fallback`);
          const fallbackResults = await searchBooks(genre, limit);
          genreCache[cacheKey] = { data: fallbackResults, timestamp: now };
          return fallbackResults;
        }
        
        // Process results in batches to reduce concurrent requests
        const processedBooks: Book[] = [];
        const batchSize = 5;
        
        for (let i = 0; i < finalWorks.length; i += batchSize) {
          const batch = finalWorks.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (work) => {
              let isbn = work.availability?.isbn || "";
              
              // If we don't have an ISBN and we have a cover_edition_key, try to fetch it
              if (!isbn && work.cover_edition_key) {
                try {
                  const fetchedIsbn = await fetchISBNFromEditionKey(work.cover_edition_key);
                  if (fetchedIsbn) {
                    isbn = fetchedIsbn;
                  }
                } catch (err) {
                  // Continue without ISBN if fetching fails
                  console.warn(`Failed to fetch ISBN for genre book:`, err);
                }
              }
              
              // Get the best available cover URL
              const coverUrl = work.cover_id 
                ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
                : (work.cover_edition_key 
                  ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
                  : "");
              
              return {
                id: work.key || `genre-${genre}-${work.title}-${work.authors?.[0]?.name || "unknown"}`,
                title: work.title || "Unknown Title",
                author: work.authors?.[0]?.name || "Unknown Author",
                isbn: isbn,
                coverUrl: coverUrl,
                description: work.description?.value || work.description || "",
                pubDate: work.first_publish_year?.toString() || "",
                pageCount: work.number_of_pages_median || 0,
                categories: [genre]
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
