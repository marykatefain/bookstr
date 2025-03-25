
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
    
    const response = await fetch(`${API_BASE_URL}?books/${key}.json`, {
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
    
    const response = await fetch(`${API_BASE_URL}?${authorKey.substring(1)}.json`, {
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
    : "";
  
  // Extract the first available ISBN
  let isbn = "";
  if (doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
    isbn = doc.isbn[0];
  }
  
  return {
    id: doc.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
    title: doc.title || "Unknown Title",
    author: doc.author_name?.[0] || "Unknown Author",
    isbn: isbn,
    coverUrl: coverUrl,
    description: doc.description || "",
    pubDate: doc.first_publish_year?.toString() || doc.publish_date?.[0] || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3) || [],
    author_name: doc.author_name || []
  };
}
