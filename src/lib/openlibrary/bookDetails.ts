
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey, fetchAuthorDetails } from './utils';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Simple in-memory cache for book details
const bookCache: Record<string, { data: Book | null; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get details for a specific book by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    console.error("Invalid ISBN provided");
    return null;
  }

  console.log(`getBookByISBN called for ISBN: ${isbn}`);

  // Check cache first
  const now = Date.now();
  const cached = bookCache[isbn];
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`Using cached data for ISBN ${isbn}`);
    return cached.data;
  }

  try {
    console.log(`Fetching book details from OpenLibrary for ISBN: ${isbn}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // FIX: Use the correct path structure for ISBN endpoint
    const response = await fetch(`${API_BASE_URL}/isbn/${isbn}.json`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      // Use browser cache
      cache: 'force-cache'
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} for ISBN ${isbn}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Got book data for ISBN ${isbn}:`, data);
    
    const workKey = data.works?.[0]?.key;
    
    let workData = null;
    if (workKey) {
      try {
        console.log(`Fetching work data for ${workKey}`);
        const workTimeoutId = setTimeout(() => controller.abort(), 10000);
        // FIX: Use the correct path structure for works endpoint
        const workResponse = await fetch(`${API_BASE_URL}${workKey}.json`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
          // Use browser cache
          cache: 'force-cache'
        });
        clearTimeout(workTimeoutId);
        
        if (workResponse.ok) {
          workData = await workResponse.json();
          console.log(`Got work data:`, workData);
        } else {
          console.error(`Work API error: ${workResponse.status} for ${workKey}`);
        }
      } catch (workError) {
        console.error("Error fetching work data:", workError);
        // Continue with partial data
      }
    }
    
    // Fetch author details if available
    let authorNames: string[] = [];
    let authorName = "Unknown Author";
    
    if (data.authors && Array.isArray(data.authors) && data.authors.length > 0) {
      const authorPromises = data.authors.map(async (author: any) => {
        if (author.key) {
          const authorDetail = await fetchAuthorDetails(author.key);
          return authorDetail;
        }
        return author.name || "Unknown Author";
      });
      
      authorNames = await Promise.all(authorPromises);
      authorName = authorNames[0] || "Unknown Author";
    } else if (workData?.authors && Array.isArray(workData.authors)) {
      const authorPromises = workData.authors.map(async (author: any) => {
        if (author.author?.key) {
          const authorDetail = await fetchAuthorDetails(author.author.key);
          return authorDetail;
        }
        return "Unknown Author";
      });
      
      authorNames = await Promise.all(authorPromises);
      authorName = authorNames[0] || "Unknown Author";
    }
    
    // Create book object with available data
    const book: Book = {
      id: workData?.key || `isbn:${isbn}`,
      title: data.title || "Unknown Title",
      author: authorName,
      author_name: authorNames.length > 0 ? authorNames : undefined,
      isbn: isbn,
      coverUrl: getCoverUrl(isbn, data.covers?.[0]),
      description: typeof workData?.description === 'string' ? workData.description : workData?.description?.value || "",
      pubDate: data.publish_date || workData?.first_publish_date || "",
      pageCount: data.number_of_pages || 0,
      categories: workData?.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
    };

    console.log(`Successfully processed book data for ISBN ${isbn}`, book);

    // Cache the result
    bookCache[isbn] = { data: book, timestamp: now };
    
    return book;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    
    // Cache the error state to prevent repeated failed requests
    if (!bookCache[isbn]) {
      bookCache[isbn] = { data: null, timestamp: now - (CACHE_TTL - 60000) }; // Cache for 1 minute on errors
    }
    
    return null;
  }
}

/**
 * Get book details by edition key (used as fallback when no ISBN is available)
 */
export async function getBookByEditionKey(editionKey: string): Promise<Book | null> {
  if (!editionKey || editionKey.trim() === '') {
    console.error("Invalid edition key provided");
    return null;
  }

  try {
    // FIX: Use the correct path structure for books endpoint
    const response = await fetch(`${API_BASE_URL}/books/${editionKey}.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to get ISBN from the edition data
    let isbn = data.isbn_13?.[0] || data.isbn_10?.[0] || "";
    
    // If no ISBN directly available, try to extract it using identifiers
    if (!isbn && data.identifiers) {
      if (data.identifiers.isbn_13) isbn = data.identifiers.isbn_13[0];
      else if (data.identifiers.isbn_10) isbn = data.identifiers.isbn_10[0];
    }
    
    // If we still don't have an ISBN, fetch it as a last resort
    if (!isbn && editionKey.startsWith('OL')) {
      isbn = await fetchISBNFromEditionKey(editionKey);
    }
    
    const workKey = data.works?.[0]?.key;
    let workData = null;
    
    if (workKey) {
      // FIX: Use the correct path structure for works endpoint
      const workResponse = await fetch(`${API_BASE_URL}${workKey}.json`);
      workData = await workResponse.json();
    }
    
    return {
      id: workData?.key || `edition:${editionKey}`,
      title: data.title || "Unknown Title",
      author: data.authors?.[0]?.name || "Unknown Author",
      isbn: isbn,
      coverUrl: getCoverUrl(isbn, data.covers?.[0]),
      description: typeof workData?.description === 'string' ? workData.description : workData?.description?.value || "",
      pubDate: data.publish_date || workData?.first_publish_date || "",
      pageCount: data.number_of_pages || 0,
      categories: workData?.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
    };
  } catch (error) {
    console.error("Error fetching book by edition key:", error);
    return null;
  }
}

/**
 * Get multiple books by their ISBNs
 */
export async function getBooksByISBN(isbns: string[]): Promise<Book[]> {
  // Filter out any invalid ISBNs
  const validIsbns = isbns.filter(isbn => isbn && isbn.trim() !== '');
  if (validIsbns.length === 0) {
    return [];
  }

  // Check cache first for all books
  const now = Date.now();
  const cachedBooks: Book[] = [];
  const isbnsToFetch: string[] = [];
  
  validIsbns.forEach(isbn => {
    const cached = bookCache[isbn];
    if (cached && cached.data && (now - cached.timestamp < CACHE_TTL)) {
      cachedBooks.push(cached.data);
    } else {
      isbnsToFetch.push(isbn);
    }
  });
  
  // If all books are cached, return them immediately
  if (isbnsToFetch.length === 0) {
    return cachedBooks;
  }
  
  // Fetch missing books with concurrency limit
  const fetchBook = async (isbn: string): Promise<Book | null> => {
    try {
      return await getBookByISBN(isbn);
    } catch (error) {
      console.error(`Error fetching book ${isbn}:`, error);
      return null;
    }
  };
  
  // Fetch in batches of 5 to avoid overwhelming the API
  const batchSize = 5;
  const fetchedBooks: Book[] = [];
  
  for (let i = 0; i < isbnsToFetch.length; i += batchSize) {
    const batch = isbnsToFetch.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchBook));
    fetchedBooks.push(...batchResults.filter((book): book is Book => book !== null));
  }
  
  return [...cachedBooks, ...fetchedBooks];
}

