
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, getAuthorName } from './utils';

/**
 * Get trending or popular books
 */
export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  try {
    // Using subjects that typically have popular books
    const response = await fetch(`${BASE_URL}/subjects/fiction.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    return works
      .filter((work: any) => work.cover_id)
      .map((work: any) => {
        const isbn = work.availability?.isbn || "";
        return {
          id: work.key,
          title: work.title,
          author: work.authors?.[0]?.name || "Unknown Author",
          isbn: isbn,
          coverUrl: getCoverUrl(isbn, work.cover_id),
          description: work.description?.value || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: [data.name || "Fiction"]
        };
      });
  } catch (error) {
    console.error("Error fetching trending books:", error);
    return [];
  }
}

/**
 * Get recently added books
 */
export async function getRecentBooks(limit: number = 10): Promise<Book[]> {
  try {
    // Newly added books to OpenLibrary
    const response = await fetch(`${BASE_URL}/recent.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const entries = data.recent || [];
    const bookPromises = entries
      .filter((entry: any) => entry.type === 'work' && entry.work)
      .slice(0, limit)
      .map(async (entry: any) => {
        try {
          const workResponse = await fetch(`${BASE_URL}${entry.work}.json`);
          const work = await workResponse.json();
          const coverId = work.covers?.[0];
          return {
            id: work.key,
            title: work.title,
            author: work.authors?.[0]?.author?.key ? await getAuthorName(work.authors[0].author.key) : "Unknown Author",
            isbn: "", // Often not available for new entries
            coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg",
            description: typeof work.description === 'string' ? work.description : work.description?.value || "",
            pubDate: work.first_publish_date || "",
            pageCount: 0,
            categories: work.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || ["Fiction"]
          };
        } catch (err) {
          console.error("Error fetching work details:", err);
          return null;
        }
      });
      
    const books = await Promise.all(bookPromises);
    return books.filter((book): book is Book => book !== null);
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}
