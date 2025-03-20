
import { OpenLibraryDoc } from './types';
import { Book } from "@/lib/nostr/types";

/**
 * Extract ISBN from OpenLibrary data using multiple methods
 */
export function extractISBN(doc: OpenLibraryDoc): string {
  // Method 1: Direct ISBN from isbn field (most reliable when available)
  if (doc.isbn && doc.isbn.length > 0) {
    console.log(`Found ISBN directly in isbn field: ${doc.isbn[0]}`);
    return doc.isbn[0];
  }
  
  // Method 2: Check lending_identifier_s field
  if (doc.lending_identifier_s && doc.lending_identifier_s.startsWith('isbn_')) {
    const isbn = doc.lending_identifier_s.replace('isbn_', '');
    console.log(`Found ISBN in lending_identifier_s: ${isbn}`);
    return isbn;
  }
  
  // Method 3: Check ia field for ISBN entries
  if (doc.ia && Array.isArray(doc.ia)) {
    for (const entry of doc.ia) {
      if (entry.startsWith('isbn_')) {
        const isbn = entry.replace('isbn_', '');
        console.log(`Found ISBN in ia field: ${isbn}`);
        return isbn;
      }
    }
  }
  
  console.log(`No ISBN found for document with title: ${doc.title}`);
  // No ISBN found with any method
  return "";
}

/**
 * Fetch ISBN from a cover edition key (OL key) using the Editions API
 * This is the most reliable method to get ISBNs
 */
export async function fetchISBNFromEditionKey(editionKey: string): Promise<string> {
  if (!editionKey) return "";
  
  console.log(`fetchISBNFromEditionKey called for: ${editionKey}`);
  
  try {
    // Use the Editions API for direct access to edition details including ISBNs
    const response = await fetch(`https://openlibrary.org/books/${editionKey}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch edition data for ${editionKey}: ${response.status}`);
      return "";
    }
    
    const data = await response.json();
    console.log(`Edition data for ${editionKey}:`, data);
    
    // Try to get ISBN-13 first (preferred), then ISBN-10
    if (data.isbn_13 && data.isbn_13.length > 0) {
      console.log(`Found ISBN-13 for ${editionKey}: ${data.isbn_13[0]}`);
      return data.isbn_13[0];
    }
    
    if (data.isbn_10 && data.isbn_10.length > 0) {
      console.log(`Found ISBN-10 for ${editionKey}: ${data.isbn_10[0]}`);
      return data.isbn_10[0];
    }
    
    // Check identifiers object if direct properties aren't available
    if (data.identifiers) {
      if (data.identifiers.isbn_13 && data.identifiers.isbn_13.length > 0) {
        console.log(`Found ISBN-13 in identifiers: ${data.identifiers.isbn_13[0]}`);
        return data.identifiers.isbn_13[0];
      }
      if (data.identifiers.isbn_10 && data.identifiers.isbn_10.length > 0) {
        console.log(`Found ISBN-10 in identifiers: ${data.identifiers.isbn_10[0]}`);
        return data.identifiers.isbn_10[0];
      }
    }
    
    console.log(`No ISBN found for edition key: ${editionKey}`);
    return "";
  } catch (error) {
    console.error("Error fetching ISBN from edition key:", error);
    return "";
  }
}

/**
 * Extract author name from OpenLibrary doc
 * Handles both author_name array and author_key fields
 */
export function extractAuthorName(doc: OpenLibraryDoc): string {
  // First try to get author name directly from author_name array
  if (doc.author_name && Array.isArray(doc.author_name) && doc.author_name.length > 0) {
    return doc.author_name[0];
  }
  
  // If we don't have author_name but have author key, use a placeholder
  // The actual name could be fetched asynchronously if needed
  if (doc.author_key && Array.isArray(doc.author_key) && doc.author_key.length > 0) {
    return "Author ID: " + doc.author_key[0];
  }
  
  return "Unknown Author";
}

/**
 * Helper to convert an OpenLibrary doc to our Book type
 */
export function docToBook(doc: OpenLibraryDoc): Book {
  // Extract ISBN using our enhanced function
  const isbn = extractISBN(doc);
  
  // Extract author name using our new helper function
  const authorName = extractAuthorName(doc);
  
  // Extract categories from subjects or create a default category
  const categories = doc.subject
    ? doc.subject.slice(0, 3).map(s => s.replace(/^./, c => c.toUpperCase()))
    : [];
    
  return {
    id: doc.key || `ol-${isbn || doc.cover_i || Math.random().toString(36).substr(2, 9)}`,
    title: doc.title || "Unknown Title",
    author: authorName,
    isbn: isbn,
    coverUrl: getCoverUrl(isbn, doc.cover_i),
    description: doc.description || "",
    pubDate: doc.first_publish_year?.toString() || doc.publish_date?.[0] || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: categories
  };
}

/**
 * Get the cover URL for a book
 */
export function getCoverUrl(isbn: string, coverId?: number): string {
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
}

/**
 * Get the name of an author from their key
 */
export async function getAuthorName(authorKey: string): Promise<string> {
  try {
    const response = await fetch(`https://openlibrary.org${authorKey}.json`);
    if (!response.ok) {
      return "Unknown Author";
    }
    const author = await response.json();
    return author.name || "Unknown Author";
  } catch (error) {
    console.error("Error fetching author:", error);
    return "Unknown Author";
  }
}
