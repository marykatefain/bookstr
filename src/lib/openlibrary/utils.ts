
import { BASE_URL } from './types';
import { Book } from "@/lib/nostr/types";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for ISBN lookup by edition key
const isbnCache: Record<string, string> = {};

// Cache for ISBN lookup by title and author
const titleAuthorIsbnCache: Record<string, string> = {};

// Cache for author details to reduce duplicate requests
const authorCache: Record<string, { name: string; timestamp: number }> = {};
const AUTHOR_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Generate the most appropriate cover URL for a book
 * With improved fallbacks and error handling
 */
export function getCoverUrl(isbn: string, coverId?: number): string {
  if (!isbn && !coverId) {
    return "";
  }

  // Prioritize cover ID if available (more reliable)
  if (coverId) {
    return `${API_BASE_URL}/covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  } 
  
  // Fallback to ISBN-based cover
  if (isbn && isbn.trim() !== '') {
    // Clean ISBN (remove any hyphens or spaces)
    const cleanIsbn = isbn.replace(/[\s-]/g, '');
    return `${API_BASE_URL}/covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
  }
  
  return "";
}

/**
 * Fetch ISBN from edition key
 */
export async function fetchISBNFromEditionKey(editionKey: string): Promise<string> {
  // Check cache first
  if (isbnCache[editionKey]) {
    return isbnCache[editionKey];
  }
  
  try {
    // Convert OL12345M to just 12345 if needed
    const key = editionKey.startsWith('OL') ? editionKey : `OL${editionKey}`;
    
    // Use the correct path structure for books endpoint
    const response = await fetch(`${API_BASE_URL}/books/${key}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch edition data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check all possible ISBN locations
    let isbn = '';
    
    // Try ISBN 13 first (preferred)
    if (data.isbn_13 && data.isbn_13.length > 0) {
      isbn = data.isbn_13[0];
    }
    // Then try ISBN 10
    else if (data.isbn_10 && data.isbn_10.length > 0) {
      isbn = data.isbn_10[0];
    }
    // Then check identifiers object
    else if (data.identifiers) {
      if (data.identifiers.isbn_13 && data.identifiers.isbn_13.length > 0) {
        isbn = data.identifiers.isbn_13[0];
      }
      else if (data.identifiers.isbn_10 && data.identifiers.isbn_10.length > 0) {
        isbn = data.identifiers.isbn_10[0];
      }
    }
    
    // Cache the result (even if empty)
    isbnCache[editionKey] = isbn;
    
    return isbn;
  } catch (error) {
    console.error(`Error fetching ISBN for edition key ${editionKey}:`, error);
    return '';
  }
}

/**
 * Fetch ISBN for a book by title and author
 */
export async function fetchISBNByTitleAuthor(title: string, author?: string): Promise<string> {
  if (!title) {
    return '';
  }
  
  // Generate a cache key from title and author
  const cacheKey = `${title.toLowerCase()}-${(author || '').toLowerCase()}`;
  
  // Check cache first
  if (titleAuthorIsbnCache[cacheKey]) {
    return titleAuthorIsbnCache[cacheKey];
  }
  
  try {
    // Create search query
    const searchTerms = author ? `${title} ${author}` : title;
    const encodedQuery = encodeURIComponent(searchTerms);
    
    // FIX: Ensure search.json is in the path
    const response = await fetch(
      `${API_BASE_URL}/search.json?q=${encodedQuery}&fields=key,title,author_name,editions,editions.key,editions.title,editions.ebook_access,editions.isbn`, 
      {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) {
      return '';
    }
    
    // Find the first document that looks like a good match
    let isbn = '';
    
    for (const doc of data.docs) {
      // Check for exact title match
      if (doc.title.toLowerCase() === title.toLowerCase()) {
        // If we have editions with ISBNs, use the first one
        if (doc.editions && Array.isArray(doc.editions)) {
          for (const edition of doc.editions) {
            if (edition.isbn && Array.isArray(edition.isbn) && edition.isbn.length > 0) {
              isbn = edition.isbn[0];
              break;
            }
          }
        }
        
        // If we found an ISBN, break out of the loop
        if (isbn) break;
      }
    }
    
    // If we didn't find an exact match, just use the first result with an ISBN
    if (!isbn && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.editions && Array.isArray(doc.editions)) {
          for (const edition of doc.editions) {
            if (edition.isbn && Array.isArray(edition.isbn) && edition.isbn.length > 0) {
              isbn = edition.isbn[0];
              break;
            }
          }
        }
        
        // If we found an ISBN, break out of the loop
        if (isbn) break;
      }
    }
    
    // Cache the result (even if empty)
    titleAuthorIsbnCache[cacheKey] = isbn;
    
    return isbn;
  } catch (error) {
    console.error(`Error fetching ISBN for title "${title}":`, error);
    return '';
  }
}

/**
 * Fetch author details from an author key
 * Returns author name as a string, with fallback to "Unknown Author"
 */
export async function fetchAuthorDetails(authorKey: string): Promise<string> {
  if (!authorKey) {
    console.log("Empty author key provided");
    return "Unknown Author";
  }
  
  // Normalize the author key
  let normalizedKey = authorKey;
  
  // Make sure the key starts with a slash if it's not a full URL
  if (!normalizedKey.startsWith('/') && !normalizedKey.startsWith('http')) {
    normalizedKey = `/${normalizedKey}`;
  }
  
  // Return from cache if available
  const now = Date.now();
  const cachedAuthor = authorCache[normalizedKey];
  if (cachedAuthor && now - cachedAuthor.timestamp < AUTHOR_CACHE_TTL) {
    console.log(`Using cached author data for ${normalizedKey}: ${cachedAuthor.name}`);
    return cachedAuthor.name;
  }
  
  try {
    console.log(`Fetching author details for key: ${normalizedKey}`);
    
    // Ensure we're using the right format for the API call
    const response = await fetch(`${API_BASE_URL}${normalizedKey}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch author details for ${normalizedKey}: ${response.status}`);
      return "Unknown Author";
    }
    
    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid author data format for ${normalizedKey}`);
      return "Unknown Author";
    }
    
    // Extract author name from response
    const authorName = data.name || "Unknown Author";
    console.log(`Found author name: "${authorName}" for key ${normalizedKey}`);
    
    // Cache the result
    authorCache[normalizedKey] = { 
      name: authorName, 
      timestamp: now 
    };
    
    return authorName;
  } catch (error) {
    console.error(`Error fetching author details for ${normalizedKey}:`, error);
    return "Unknown Author";
  }
}

/**
 * Convert an OpenLibrary doc to a Book object
 * With improved cover URL generation
 */
export function docToBook(doc: any): Book {
  // Get the best available cover URL
  let coverUrl = "";
  
  // Try to get cover URL in a more reliable way
  if (doc.cover_i) {
    coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  } else if (doc.cover_edition_key) {
    coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
  }
  
  // If we have an ISBN but no cover yet, try ISBN-based cover
  if (!coverUrl && doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
    const cleanIsbn = doc.isbn[0].replace(/[\s-]/g, '');
    coverUrl = `${API_BASE_URL}/covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
  }
  
  // Extract the first available ISBN - try to get all possible ISBN sources
  let isbn = "";
  
  // Check many possible sources for ISBN
  if (doc.isbn_13 && Array.isArray(doc.isbn_13) && doc.isbn_13.length > 0) {
    isbn = doc.isbn_13[0];
  } else if (doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
    isbn = doc.isbn[0];
  } else if (doc.availability && doc.availability.isbn) {
    isbn = doc.availability.isbn;
  }
  
  return {
    id: doc.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
    title: doc.title || "Unknown Title",
    author: doc.author_name?.[0] || doc.authors?.[0]?.name || "Unknown Author",
    isbn: isbn,
    coverUrl: coverUrl,
    description: doc.description?.value || doc.description || "",
    pubDate: doc.first_publish_year?.toString() || doc.publish_date?.[0] || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3) || [],
    author_name: doc.author_name || (doc.authors ? doc.authors.map((a: any) => a.name).filter(Boolean) : [])
  };
}
