
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey, docToBook } from './utils';
import { throttlePromises } from '@/lib/utils';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for search results with appropriate TTL
const searchCache: Record<string, { data: Book[], timestamp: number }> = {};
const SEARCH_CACHE_TTL = 1000 * 60 * 10; // 10 minutes cache for searches

// Calculate the minimum publication year for the 5-year filter
const CURRENT_YEAR = new Date().getFullYear();
const MIN_PUB_YEAR = CURRENT_YEAR - 5;

/**
 * Search for books by title or author
 */
export async function searchBooks(query: string, limit: number = 20, quickMode: boolean = false): Promise<Book[]> {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // Create a cache key that includes quickMode parameter
    const cacheKey = `${query.toLowerCase()}-${limit}-${quickMode ? 'quick' : 'full'}`;
    const now = Date.now();
    
    // Check cache first
    const cached = searchCache[cacheKey];
    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL)) {
      console.log(`Using cached search results for "${query}"`);
      return cached.data;
    }
    
    // Construct the API URL
    const apiUrl = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
  
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(quickMode ? 5000 : 8000)
    });
      
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Search returned ${data.docs?.length || 0} results for "${query}"`);
    
    if (!data.docs || !Array.isArray(data.docs)) {
      return [];
    }
    
    // In quick mode, we do minimal processing for speed
    if (quickMode) {
      const results = await processBasicSearchResults(data.docs, limit);
      searchCache[cacheKey] = { data: results, timestamp: now };
      return results;
    }
    
    // For full results, we want to filter by publication year and complete data
    const filteredDocs = data.docs
      .filter(doc => {
        // Keep books with a recent publication year
        const pubYear = doc.first_publish_year || doc.publish_year?.[0] || 0;
        return pubYear >= MIN_PUB_YEAR || (doc.isbn && doc.cover_i);
      })
      .sort((a, b) => {
        // Prioritize books with complete data
        const aComplete = Boolean(a.isbn && a.cover_i);
        const bComplete = Boolean(b.isbn && b.cover_i);
        
        if (aComplete && !bComplete) return -1;
        if (!aComplete && bComplete) return 1;
        
        // Then prioritize recent books
        const aYear = a.first_publish_year || a.publish_year?.[0] || 0;
        const bYear = b.first_publish_year || b.publish_year?.[0] || 0;
        return bYear - aYear;
      });
    
    // Get the final limit of books
    const finalDocs = filteredDocs.slice(0, limit);
    
    // For each book, fetch additional details if needed
    const bookPromises = finalDocs.map(doc => {
      const processedBook = docToBook(doc);
      
      // If we don't have an ISBN and we have a cover_edition_key, try to fetch it
      if (!processedBook.isbn && doc.cover_edition_key) {
        return (async () => {
          try {
            const isbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
            if (isbn) {
              return {
                ...processedBook,
                isbn
              };
            }
          } catch (error) {
            console.error(`Error fetching ISBN for book:`, error);
          }
          return processedBook;
        })();
      }
      
      return Promise.resolve(processedBook);
    });
    
    // Process books in parallel with throttling to avoid hammering the API
    // Fix: Explicitly type the result as Book[]
    const books = await throttlePromises<Book>(bookPromises, 5);
    
    // Cache the results
    searchCache[cacheKey] = { data: books, timestamp: now };
    
    console.log(`Processed ${books.length} books from search results`);
    return books;
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

/**
 * Process search results quickly without fetching additional details
 * Improved to ensure valid cover URLs and better handling of missing data
 */
export async function processBasicSearchResults(docs: any[], limit: number): Promise<Book[]> {
  if (!docs || !Array.isArray(docs) || docs.length === 0) {
    console.log("No documents to process in processBasicSearchResults");
    return [];
  }

  console.log(`Processing ${docs.length} basic search results`);
  const processedBooks: Book[] = [];
  
  for (let i = 0; i < Math.min(docs.length, limit); i++) {
    const doc = docs[i];
    if (!doc) continue;
    
    // Extract ISBN (try various possible sources)
    let isbn = "";
    if (doc.isbn_13 && Array.isArray(doc.isbn_13) && doc.isbn_13.length > 0) {
      isbn = doc.isbn_13[0];
    } else if (doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
      isbn = doc.isbn[0];
    } else if (doc.availability && doc.availability.isbn) {
      isbn = doc.availability.isbn;
    }
    
    // Generate cover URL with multiple fallbacks
    let coverUrl = "";
    
    // Try to get the best available cover URL with multiple fallbacks
    if (doc.cover_i) {
      coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    } else if (doc.cover_edition_key) {
      coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
    } else if (isbn) {
      // Clean ISBN (remove any hyphens or spaces)
      const cleanIsbn = isbn.replace(/[\s-]/g, '');
      coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
    }
    
    // Make sure we have required fields for a valid book object
    const title = doc.title || "Unknown Title";
    const author = doc.author_name?.[0] || "Unknown Author";
    
    processedBooks.push({
      id: doc.key || `search-${title}-${Math.random().toString(36).substring(2, 8)}`,
      title: title,
      author: author,
      isbn: isbn,
      coverUrl: coverUrl,
      description: doc.description || "",
      pubDate: doc.first_publish_year?.toString() || "",
      pageCount: doc.number_of_pages_median || 0,
      categories: doc.subject?.slice(0, 3) || [],
      author_name: doc.author_name || []
    });
  }
  
  console.log(`Processed ${processedBooks.length} books from basic search results`);
  return processedBooks;
}

/**
 * Search books by genre/subject - enhanced version for search.ts that supports quickMode
 */
export async function searchBooksByGenre(
  genre: string, 
  limit: number = 20, 
  quickMode: boolean = false
): Promise<Book[]> {
  if (!genre || genre.trim() === '') {
    return [];
  }
  
  try {
    // Create a cache key that includes the quickMode parameter
    const formattedGenre = genre.toLowerCase();
    const cacheKey = `genre-${formattedGenre}-${limit}-${quickMode ? 'quick' : 'full'}`;
    const now = Date.now();
    
    // Check cache first
    const cached = searchCache[cacheKey];
    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL)) {
      console.log(`Using cached genre results for "${genre}"`);
      return cached.data;
    }
    
    // Construct the API URL with sort=new to prioritize newer books
    const apiUrl = `${BASE_URL}/subjects/${encodeURIComponent(formattedGenre)}.json?limit=${limit * 2}&sort=new`;
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(quickMode ? 5000 : 8000),
    });
      
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Genre search returned ${data.works?.length || 0} results for "${genre}"`);
    
    if (!data.works || !Array.isArray(data.works)) {
      return [];
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
    
    // In quick mode, we do minimal processing for speed
    if (quickMode) {
      const processedBooks = finalWorks.map(work => {
        // Get the best available cover URL
        const coverUrl = work.cover_id 
          ? `${API_BASE_URL}/covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : (work.cover_edition_key 
              ? `${API_BASE_URL}/covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
              : "");
        
        return {
          id: work.key || `genre-${genre}-${Math.random().toString(36).substring(2, 8)}`,
          title: work.title || "Unknown Title",
          author: work.authors?.[0]?.name || "Unknown Author",
          isbn: work.availability?.isbn || "",
          coverUrl: coverUrl,
          description: work.description?.value || work.description || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: [genre]
        };
      });
      
      // Cache the quick results
      searchCache[cacheKey] = { data: processedBooks, timestamp: now };
      return processedBooks;
    }
    
    // For full results, we fetch additional details where needed
    const bookPromises = finalWorks.map(work => {
      // Extract available information
      const isbn = work.availability?.isbn || "";
      
      // Get the best available cover URL
      const coverUrl = work.cover_id 
        ? `${API_BASE_URL}/covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
        : (work.cover_edition_key 
            ? `${API_BASE_URL}/covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
            : "");
      
      // Create the basic book object
      const bookObj: Book = {
        id: work.key || `genre-${genre}-${Math.random().toString(36).substring(2, 8)}`,
        title: work.title || "Unknown Title",
        author: work.authors?.[0]?.name || "Unknown Author",
        isbn: isbn,
        coverUrl: coverUrl,
        description: work.description?.value || work.description || "",
        pubDate: work.first_publish_year?.toString() || "",
        pageCount: work.number_of_pages_median || 0,
        categories: [genre]
      };
      
      // If we don't have an ISBN and we have a cover_edition_key, try to fetch it
      if (!isbn && work.cover_edition_key) {
        return (async () => {
          try {
            const fetchedIsbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (fetchedIsbn) {
              return {
                ...bookObj,
                isbn: fetchedIsbn
              };
            }
          } catch (error) {
            console.error(`Error fetching ISBN for genre book:`, error);
          }
          return bookObj;
        })();
      }
      
      return Promise.resolve(bookObj);
    });
    
    // Process books in parallel with throttling to avoid hammering the API
    // Fix: Explicitly type the result as Book[]
    const books = await throttlePromises<Book>(bookPromises, 5);
    
    // Cache the results
    searchCache[cacheKey] = { data: books, timestamp: now };
    
    console.log(`Processed ${books.length} books from genre search results`);
    return books;
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    // Fallback to regular search if genre search fails
    return searchBooks(genre, limit, quickMode);
  }
}
