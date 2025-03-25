
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey } from './utils';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

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
  console.log(`getDailyTrendingBooks called with limit: ${limit}`);
  
  // If we have cached data less than 15 minutes old, use it
  const now = Date.now();
  if (dailyTrendingCache.books.length > 0 && (now - dailyTrendingCache.timestamp) < 15 * 60 * 1000) {
    console.log("Using cached daily trending books data", dailyTrendingCache.books.length);
    return dailyTrendingCache.books.slice(0, limit);
  }

  try {
    console.log(`Fetching daily trending books from Cloudflare Worker`);
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/trending/daily.json?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      // Use browser cache
      cache: 'default'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Got daily trending books data:`, data);
    const works = data.works || [];
    
    if (works.length === 0) {
      console.warn("Daily trending API returned no works, falling back to alternative method");
      return getTrendingBooks(limit);
    }
    
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
            categories: ["Trending"],
            author_name: work.authors?.map((a: any) => a.name) || []
          };
        })
    );
    
    console.log(`Processed ${books.length} daily trending books`);
    
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
  console.log(`getWeeklyTrendingBooks called with limit: ${limit}`);
  
  // If we have cached data less than 30 minutes old, use it (reduced from 60 minutes)
  const now = Date.now();
  if (weeklyTrendingCache.books.length > 0 && (now - weeklyTrendingCache.timestamp) < 30 * 60 * 1000) {
    console.log("Using cached weekly trending books data", weeklyTrendingCache.books.length);
    return weeklyTrendingCache.books.slice(0, limit);
  }

  try {
    console.log(`Fetching weekly trending books from Cloudflare Worker`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/trending/weekly.json?limit=${limit}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Weekly trending API returned status ${response.status}, falling back to cached data or alternative method`);
      
      // Try to use cached data even if expired
      if (weeklyTrendingCache.books.length > 0) {
        console.log("Using expired weekly trending cache as fallback");
        // Update timestamp to prevent immediate retry, but allow retry after 10 minutes
        weeklyTrendingCache.timestamp = now - (20 * 60 * 1000);
        return weeklyTrendingCache.books.slice(0, limit);
      }
      
      return await getTrendingBooks(limit);
    }
    
    const data = await response.json();
    console.log(`Got weekly trending books data:`, data);
    const works = data.works || [];
    
    if (works.length === 0) {
      console.warn("Weekly trending API returned no works, falling back to alternative method");
      return getTrendingBooks(limit);
    }
    
    // Process works in batches to avoid too many concurrent requests
    const batchSize = 5;
    const allBooks: Book[] = [];
    
    for (let i = 0; i < works.length; i += batchSize) {
      const batch = works.slice(i, i + batchSize)
        .filter((work: any) => work.cover_id || work.cover_edition_key);
      
      const batchPromises = batch.map(async (work: any) => {
        let isbn = work.availability?.isbn || "";
        
        if (!isbn && work.cover_edition_key) {
          try {
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
          } catch (error) {
            // Fail silently on ISBN fetch errors
            console.warn(`Could not fetch ISBN for edition key ${work.cover_edition_key}`);
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
          categories: ["Trending"],
          author_name: work.authors?.map((a: any) => a.name) || []
        };
      });
      
      const batchBooks = await Promise.all(batchPromises);
      allBooks.push(...batchBooks);
    }
    
    console.log(`Processed ${allBooks.length} weekly trending books`);
    
    // Update cache
    weeklyTrendingCache.books = allBooks;
    weeklyTrendingCache.timestamp = now;
    
    return allBooks.slice(0, limit);
  } catch (error) {
    console.error("Error fetching weekly trending books:", error);
    
    // If we have any cached data, use it as fallback even if expired
    if (weeklyTrendingCache.books.length > 0) {
      console.log("Using expired cache as fallback after error");
      return weeklyTrendingCache.books.slice(0, limit);
    }
    
    return await getTrendingBooks(limit);
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
  console.log(`getTrendingBooks called with limit: ${limit}`);
  
  // If we have cached data less than 15 minutes old, use it (reduced to refresh more often)
  const now = Date.now();
  if (trendingBooksCache.books.length > 0 && (now - trendingBooksCache.timestamp) < 15 * 60 * 1000) {
    console.log("Using cached trending books data", trendingBooksCache.books.length);
    return trendingBooksCache.books.slice(0, limit);
  }

  try {
    console.log(`Fetching trending books using subject API via Cloudflare Worker`);
    // Using subjects that typically have popular books
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/subjects/fiction.json?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Got fiction subject data:`, data);
    const works = data.works || [];
    
    if (works.length === 0) {
      console.warn("Subject API returned no works, using fallback subject");
      return getAlternativeTrendingBooks(limit);
    }
    
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
    
    console.log(`Processed ${books.length} trending books`);
    
    // Update cache
    trendingBooksCache.books = books;
    trendingBooksCache.timestamp = now;
    
    return books;
  } catch (error) {
    console.error("Error fetching trending books:", error);
    return getAlternativeTrendingBooks(limit);
  }
}

/**
 * Alternative method to get trending books when the regular endpoint fails
 */
async function getAlternativeTrendingBooks(limit: number = 10): Promise<Book[]> {
  try {
    console.log(`Using alternative trending books method via Cloudflare Worker`);
    // Try a different genre that's popular
    const subjects = ["fantasy", "science_fiction", "thriller", "romance"];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    console.log(`Using subject: ${randomSubject}`);
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/subjects/${randomSubject}.json?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
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
    
    console.log(`Processed ${books.length} alternative trending books`);
    return books;
  } catch (error) {
    console.error("Error in alternative trending books method:", error);
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
  console.log(`getRecentBooks called with limit: ${limit}`);
  
  // If we have cached data less than 10 minutes old, use it
  const now = Date.now();
  if (recentBooksCache.books.length > 0 && (now - recentBooksCache.timestamp) < 10 * 60 * 1000) {
    console.log("Using cached recent books data", recentBooksCache.books.length);
    return recentBooksCache.books.slice(0, limit);
  }

  try {
    console.log(`Fetching recent books from Cloudflare Worker`);
    // Using the new subjects/new.json endpoint as specified
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/subjects/new.json?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    // If the endpoint fails, use alternative method
    if (!response.ok) {
      console.log(`New subject endpoint failed with ${response.status}, using alternative method`);
      return await getAlternativeRecentBooks(limit);
    }
    
    const data = await response.json();
    console.log(`Got recent books data:`, data);
    const works = data.works || [];
    
    if (works.length === 0) {
      console.warn("Recent books API returned no works, using alternative method");
      return await getAlternativeRecentBooks(limit);
    }
    
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
    
    console.log(`Processed ${books.length} recent books`);
    
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
    console.log(`Using alternative recent books method via Cloudflare Worker`);
    // Try a different genre/subject that's less common than fiction
    const subjects = ["literature", "fantasy", "mystery", "biography"];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    console.log(`Using subject: ${randomSubject}`);
    // Fix the URL format to use the correct path structure
    const response = await fetch(`${API_BASE_URL}/subjects/${randomSubject}.json?limit=${limit}&sort=new`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
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
    
    console.log(`Processed ${books.length} alternative recent books`);
    
    // Update the cache
    recentBooksCache.books = books;
    recentBooksCache.timestamp = Date.now();
    
    return books;
  } catch (error) {
    console.error("Error in alternative recent books method:", error);
    return [];
  }
}
