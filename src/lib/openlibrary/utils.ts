
import { BASE_URL } from './types';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for ISBN lookup by edition key
const isbnCache: Record<string, string> = {};

/**
 * Generate the most appropriate cover URL for a book
 */
export function getCoverUrl(isbn: string, coverId?: number): string {
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  } else if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
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
    
    // Fix the URL format to use the correct path structure
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
 * Fetch author details from an author key
 */
export async function fetchAuthorDetails(authorKey: string): Promise<string> {
  try {
    if (!authorKey.startsWith('/')) {
      authorKey = `/${authorKey}`;
    }
    
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}${authorKey}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      return "Unknown Author";
    }
    
    const data = await response.json();
    return data.name || "Unknown Author";
  } catch (error) {
    console.error(`Error fetching author details for ${authorKey}:`, error);
    return "Unknown Author";
  }
}

/**
 * Convert an OpenLibrary doc to a Book object
 */
export function docToBook(doc: any) {
  // Get the best available cover URL
  const coverUrl = doc.cover_i 
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` 
    : (doc.cover_edition_key 
      ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`
      : "");
  
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
