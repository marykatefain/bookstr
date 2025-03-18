
import { Book } from "@/lib/nostr/types";
import { BASE_URL, OpenLibrarySearchResult } from './types';
import { docToBook } from './utils';

/**
 * Search books on OpenLibrary
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  try {
    // Use the OpenLibrary search API with proper parameters
    const response = await fetch(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    console.log("OpenLibrary search results:", data);
    
    // Map the docs to our Book format, filtering out entries without covers or ISBN
    return data.docs
      .filter(doc => doc.cover_i || (doc.isbn && doc.isbn.length > 0)) // Ensure we have cover ID or ISBN
      .map(docToBook);
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}
