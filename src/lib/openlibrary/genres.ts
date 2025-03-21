
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey } from './utils';
import { searchBooks } from './search';

// Cache for genre search results
const genreCache: Record<string, { data: Book[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache for genres

/**
 * Search books by genre/subject using the search API with rating sort
 */
export async function searchBooksByGenre(genre: string, limit: number = 20): Promise<Book[]> {
  if (!genre || genre.trim() === '') {
    return [];
  }
  
  try {
    // Create a cache key
    const cacheKey = `${genre.toLowerCase()}-${limit}`;
    const now = Date.now();
    
    // Check cache first
    const cached = genreCache[cacheKey];
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log(`Using cached genre results for "${genre}"`);
      return cached.data;
    }
    
    console.log(`Searching OpenLibrary for genre: "${genre}" with limit ${limit}`);
    
    // Convert genre to lowercase for consistency
    const formattedGenre = genre.toLowerCase();
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Use the search API with subject, ISBN filter, and rating sort
    const response = await fetch(
      `${BASE_URL}/search.json?` + 
      `q=subject:"${encodeURIComponent(formattedGenre)}"&` +
      `sort=rating&` +
      `limit=${limit}`,
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
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`OpenLibrary genre search returned ${data.docs?.length || 0} results for "${genre}"`);
    
    if (!data.docs || !Array.isArray(data.docs)) {
      console.error("Invalid docs in genre search response:", data);
      return [];
    }
    
    // Process results in batches to reduce concurrent requests
    const processedBooks: Book[] = [];
    const batchSize = 5;
    const filteredDocs = data.docs.filter(doc => doc.isbn || doc.cover_i || doc.cover_edition_key);
    
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
            id: doc.key,
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
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    // If genre search fails, try regular search as fallback
    console.log(`Falling back to regular search for: "${genre}"`);
    return searchBooks(genre, limit);
  }
}
