
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';

/**
 * Get cover URL for a book
 */
export function getCoverUrl(isbn: string, coverId?: number): string {
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } else if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  } else {
    return '/placeholder.svg';
  }
}

/**
 * Convert OpenLibrary doc to Book object
 */
export function docToBook(doc: any): Book {
  return {
    id: doc.key || `ol:${Math.random().toString(36).slice(2, 10)}`,
    title: doc.title || "Unknown Title",
    author: doc.author_name?.[0] || "Unknown Author",
    isbn: doc.isbn?.[0] || "",
    coverUrl: getCoverUrl(doc.isbn?.[0] || "", doc.cover_i),
    description: doc.description || "",
    pubDate: doc.first_publish_year?.toString() || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3)?.map((s: string) => 
      s.charAt(0).toUpperCase() + s.slice(1)
    ) || [],
    author_name: doc.author_name || []
  };
}

/**
 * Fetch ISBN from an edition key
 */
export async function fetchISBNFromEditionKey(editionKey: string): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}/books/${editionKey}.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to extract ISBN from various fields
    const isbn = 
      data.isbn_13?.[0] || 
      data.isbn_10?.[0] || 
      (data.identifiers?.isbn_13?.[0] || data.identifiers?.isbn_10?.[0] || "");
    
    return isbn;
  } catch (error) {
    console.error("Error fetching ISBN from edition key:", error);
    return "";
  }
}

/**
 * Fetch author details using author key
 */
export async function fetchAuthorDetails(authorKey: string): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}${authorKey}.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.name || "Unknown Author";
  } catch (error) {
    console.error("Error fetching author details:", error);
    return "Unknown Author";
  }
}
