
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey } from './utils';
import { searchBooks } from './search';

/**
 * Search books by genre/subject
 */
export async function searchBooksByGenre(genre: string, limit: number = 20): Promise<Book[]> {
  try {
    // Convert genre to lowercase and handle spaces for URL
    const formattedGenre = genre.toLowerCase().replace(/\s+/g, '_');
    
    // Use the subjects API to get books in a specific genre
    const response = await fetch(`${BASE_URL}/subjects/${formattedGenre}.json?limit=${limit}`);
    
    if (!response.ok) {
      // If genre not found, fall back to search
      return searchBooks(genre, limit);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    const books = await Promise.all(
      works
        .filter((work: any) => work.cover_id)
        .map(async (work: any) => {
          // Try to get ISBN from availability first
          let isbn = work.availability?.isbn || "";
          
          // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
          if (!isbn && work.cover_edition_key) {
            console.log(`Fetching ISBN for genre book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for genre book ${work.title}: ${isbn}`);
            }
          }
          
          return {
            id: work.key,
            title: work.title,
            author: work.authors?.[0]?.name || "Unknown Author",
            isbn: isbn,
            coverUrl: getCoverUrl(isbn, work.cover_id),
            description: work.description?.value || "",
            pubDate: work.first_publish_year?.toString() || "",
            pageCount: 0,
            categories: [data.name || genre]
          };
        })
    );
    
    return books;
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    return searchBooks(genre, limit); // Fallback to regular search
  }
}
