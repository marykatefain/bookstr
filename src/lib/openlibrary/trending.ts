
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, getAuthorName, fetchISBNFromEditionKey } from './utils';

/**
 * Get daily trending books from OpenLibrary's trending API
 */
export async function getDailyTrendingBooks(limit: number = 10): Promise<Book[]> {
  try {
    const response = await fetch(`${BASE_URL}/trending/daily.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    const books = await Promise.all(
      works
        .filter((work: any) => work.cover_id || work.cover_edition_key)
        .map(async (work: any) => {
          let isbn = work.availability?.isbn || "";
          
          // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
          if (!isbn && work.cover_edition_key) {
            console.log(`Fetching ISBN for trending book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for trending book ${work.title}: ${isbn}`);
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
            categories: ["Trending"]
          };
        })
    );
    
    return books;
  } catch (error) {
    console.error("Error fetching daily trending books:", error);
    // Fallback to the older trending books method if the daily API fails
    return getTrendingBooks(limit);
  }
}

/**
 * Get weekly trending books from OpenLibrary's trending API
 */
export async function getWeeklyTrendingBooks(limit: number = 10): Promise<Book[]> {
  try {
    const response = await fetch(`${BASE_URL}/trending/weekly.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    const books = await Promise.all(
      works
        .filter((work: any) => work.cover_id || work.cover_edition_key)
        .map(async (work: any) => {
          let isbn = work.availability?.isbn || "";
          
          // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
          if (!isbn && work.cover_edition_key) {
            console.log(`Fetching ISBN for weekly trending book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for weekly trending book ${work.title}: ${isbn}`);
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
            categories: ["Trending"]
          };
        })
    );
    
    return books;
  } catch (error) {
    console.error("Error fetching weekly trending books:", error);
    // Fallback to the older trending books method if the weekly API fails
    return getTrendingBooks(limit);
  }
}

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
    
    const books = await Promise.all(
      works
        .filter((work: any) => work.cover_id || work.cover_edition_key)
        .map(async (work: any) => {
          let isbn = work.availability?.isbn || "";
          
          // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
          if (!isbn && work.cover_edition_key) {
            console.log(`Fetching ISBN for trending book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for trending book ${work.title}: ${isbn}`);
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
            categories: [data.name || "Fiction"]
          };
        })
    );
    
    return books;
  } catch (error) {
    console.error("Error fetching trending books:", error);
    return [];
  }
}

// Cache for recently fetched books
const recentBooksCache: {
  timestamp: number;
  books: Book[];
} = {
  timestamp: 0,
  books: []
};

/**
 * Get recently added books - with fallback if /recent.json fails
 */
export async function getRecentBooks(limit: number = 10): Promise<Book[]> {
  // If we have cached data less than 10 minutes old, use it
  const now = Date.now();
  if (recentBooksCache.books.length > 0 && (now - recentBooksCache.timestamp) < 10 * 60 * 1000) {
    console.log("Using cached recent books data");
    return recentBooksCache.books.slice(0, limit);
  }

  try {
    // Try to fetch from the recent endpoint first
    const response = await fetch(`${BASE_URL}/recent.json?limit=${limit}`);
    
    // If the endpoint fails, use alternative method
    if (!response.ok) {
      console.log(`Recent books endpoint failed with ${response.status}, using alternative method`);
      return await getAlternativeRecentBooks(limit);
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
          
          let isbn = "";
          
          // Try to get ISBN from edition key if available
          if (work.cover_edition_key) {
            console.log(`Fetching ISBN for recent book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for recent book ${work.title}: ${isbn}`);
            }
          }
          
          return {
            id: work.key,
            title: work.title,
            author: work.authors?.[0]?.author?.key ? await getAuthorName(work.authors[0].author.key) : "Unknown Author",
            isbn: isbn,
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
    const validBooks = books.filter((book): book is Book => book !== null);
    
    // Update cache
    recentBooksCache.books = validBooks;
    recentBooksCache.timestamp = now;
    
    return validBooks;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return await getAlternativeRecentBooks(limit);
  }
}

/**
 * Alternative method to get recent books when the regular endpoint fails
 * This uses a different subjects endpoint as a fallback
 */
async function getAlternativeRecentBooks(limit: number = 10): Promise<Book[]> {
  try {
    // Try a different genre/subject that's less common than fiction
    const subjects = ["literature", "fantasy", "mystery", "biography"];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    console.log(`Using alternative recent books method with subject: ${randomSubject}`);
    const response = await fetch(`${BASE_URL}/subjects/${randomSubject}.json?limit=${limit}&sort=new`);
    
    if (!response.ok) {
      throw new Error(`Alternative API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    const books = await Promise.all(
      works
        .filter((work: any) => work.cover_id || work.cover_edition_key)
        .map(async (work: any) => {
          let isbn = work.availability?.isbn || "";
          
          if (!isbn && work.cover_edition_key) {
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
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
            categories: [data.name || randomSubject]
          };
        })
    );
    
    // Update the cache
    recentBooksCache.books = books;
    recentBooksCache.timestamp = Date.now();
    
    return books;
  } catch (error) {
    console.error("Error in alternative recent books method:", error);
    return [];
  }
}
