
import { OpenLibraryDoc } from './types';
import { Book } from "@/lib/nostr/types";

/**
 * Helper to convert an OpenLibrary doc to our Book type
 */
export function docToBook(doc: OpenLibraryDoc): Book {
  const isbn = doc.isbn?.[0] || "";
  return {
    id: doc.key || `ol-${isbn}`,
    title: doc.title,
    author: doc.author_name?.[0] || "Unknown Author",
    isbn: isbn,
    coverUrl: getCoverUrl(isbn, doc.cover_i),
    description: doc.description || "",
    pubDate: doc.first_publish_year?.toString() || doc.publish_date?.[0] || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3).map(s => s.replace(/^./, c => c.toUpperCase())) || []
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
