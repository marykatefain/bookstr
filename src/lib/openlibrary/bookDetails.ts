
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl } from './utils';

/**
 * Get details for a specific book by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  try {
    const response = await fetch(`${BASE_URL}/isbn/${isbn}.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const workKey = data.works?.[0]?.key;
    
    if (workKey) {
      const workResponse = await fetch(`${BASE_URL}${workKey}.json`);
      const work = await workResponse.json();
      
      return {
        id: work.key,
        title: data.title,
        author: data.authors?.[0]?.name || "Unknown Author",
        isbn: isbn,
        coverUrl: getCoverUrl(isbn, data.covers?.[0]),
        description: typeof work.description === 'string' ? work.description : work.description?.value || "",
        pubDate: data.publish_date || work.first_publish_date || "",
        pageCount: data.number_of_pages || 0,
        categories: work.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    return null;
  }
}

/**
 * Get multiple books by their ISBNs
 */
export async function getBooksByISBN(isbns: string[]): Promise<Book[]> {
  const bookPromises = isbns.map(isbn => getBookByISBN(isbn));
  const books = await Promise.all(bookPromises);
  return books.filter((book): book is Book => book !== null);
}
