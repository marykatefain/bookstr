import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, getAuthorName, fetchISBNFromEditionKey } from './utils';

// Cache for weekly trending books
const weeklyTrendingCache: {
  timestamp: number;
  books: Book[];
} = {
  timestamp: 0,
  books: []
};

// Cache for daily trending books
const dailyTrendingCache: {
  timestamp: number;
  books: Book[];
} = {
  timestamp: 0,
  books: []
};

/**
 * Get daily trending books from OpenLibrary's trending API
 */
export async function getDailyTrendingBooks(limit: number = 10): Promise<Book[]> {
  // If we have cached data less than 30 minutes old, use it
  const now = Date.now();
  if (dailyTrendingCache.books.length > 0 && (now - dailyTrendingCache.timestamp) < 30 * 60 * 1000) {
    console.log("Using cached daily trending books data");
    return dailyTrendingCache.books.slice(0, limit);
  }

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
    
    // Update cache
    dailyTrendingCache.books = books;
    dailyTrendingCache.timestamp = now;
    
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
  // If we have cached data less than 30 minutes old, use it
  const now = Date.now();
  if (weeklyTrendingCache.books.length > 0 && (now - weeklyTrendingCache.timestamp) < 30 * 60 * 1000) {
    console.log("Using cached weekly trending books data");
    return weeklyTrendingCache.books.slice(0, limit);
  }

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
    
    // Update cache
    weeklyTrendingCache.books = books;
    weeklyTrendingCache.timestamp = now;
    
    return books;
  } catch (error) {
    console.error("Error fetching weekly trending books:", error);
    // Fallback to the older trending books method if the weekly API fails
    return getTrendingBooks(limit);
  }
}

// Cache for trending books
const trendingBooksCache: {
  timestamp: number;
  books: Book[];
} = {
  timestamp: 0,
  books: []
};

/**
 * Get trending or popular books
 */
export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  // If we have cached data less than 30 minutes old, use it
  const now = Date.now();
  if (trendingBooksCache.books.length > 0 && (now - trendingBooksCache.timestamp) < 30 * 60 * 1000) {
    console.log("Using cached trending books data");
    return trendingBooksCache.books.slice(0, limit);
  }

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
    
    // Update cache
    trendingBooksCache.books = books;
    trendingBooksCache.timestamp = now;
    
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
 * Get recently added books - using the "new" subject endpoint
 */
export async function getRecentBooks(limit: number = 10): Promise<Book[]> {
  // If we have cached data less than 10 minutes old, use it
  const now = Date.now();
  if (recentBooksCache.books.length > 0 && (now - recentBooksCache.timestamp) < 10 * 60 * 1000) {
    console.log("Using cached recent books data");
    return recentBooksCache.books.slice(0, limit);
  }

  try {
    // Using the new subjects/new.json endpoint as specified
    const response = await fetch(`${BASE_URL}/subjects/new.json?limit=${limit}`);
    
    // If the endpoint fails, use alternative method
    if (!response.ok) {
      console.log(`New subject endpoint failed with ${response.status}, using alternative method`);
      return await getAlternativeRecentBooks(limit);
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
            console.log(`Fetching ISBN for recent book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for recent book ${work.title}: ${isbn}`);
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
            categories: [data.name || "New Books"]
          };
        })
    );
    
    // Update cache
    recentBooksCache.books = books;
    recentBooksCache.timestamp = now;
    
    return books;
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
