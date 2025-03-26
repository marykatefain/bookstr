import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { fetchISBNFromEditionKey } from "@/lib/openlibrary/utils";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for storing query results to avoid repeated requests
const queryCache: {
  [key: string]: {
    timestamp: number;
    data: Book[];
  }
} = {};

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Custom hook for fetching trending books from OpenLibrary's daily trending API
 */
export function useTrendingQuery(limit: number = 20) {
  const { toast } = useToast();
  
  const fetchTrendingQuery = useCallback(async (): Promise<Book[]> => {
    console.log(`Fetching daily trending books, limit: ${limit}`);
    
    // Check cache first
    const cacheKey = `trending_daily_${limit}`;
    const now = Date.now();
    const cached = queryCache[cacheKey];
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log("Using cached daily trending results");
      return cached.data;
    }
    
    try {
      // Use the trending/daily API via Cloudflare Worker with fixed URL format
      const response = await fetch(`${API_BASE_URL}/trending/daily.json?limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        console.log(`Got daily trending data: ${data.works?.length || 0} results`);
        
        if (!data.works || data.works.length === 0) {
          throw new Error("No trending books returned");
        }
        
        // Process works and fetch ISBNs where needed
        const booksPromises = data.works.map(async (work: any) => {
          // Try to get ISBN from availability first
          let isbn = work.availability?.isbn || "";
          
          // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
          if (!isbn && work.cover_edition_key) {
            console.log(`Fetching ISBN for trending book: ${work.title} using edition key: ${work.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
          }
          
          // Determine the best cover URL
          let coverUrl = work.cover_id 
            ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
            : (work.cover_edition_key 
              ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
              : "");
          
          // If we have ISBN but no cover, try to use ISBN for cover
          if (!coverUrl && isbn) {
            coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
          }
            
          return {
            id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
            title: work.title || "Unknown Title",
            author: work.authors?.[0]?.name || work.author_name?.[0] || "Unknown Author",
            isbn: isbn,
            coverUrl: coverUrl,
            description: work.description?.value || work.description || "",
            pubDate: work.first_publish_year?.toString() || "",
            pageCount: 0,
            categories: ["Trending Today"],
            author_name: work.authors?.map((a: any) => a.name) || work.author_name || []
          };
        });
        
        const books = await Promise.all(booksPromises);
        
        // Cache the results
        queryCache[cacheKey] = {
          timestamp: now,
          data: books
        };
        
        return books;
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError, "Response:", responseText);
        throw new Error("Failed to parse API response");
      }
    } catch (error) {
      console.error("Error fetching daily trending books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching trending books.",
        variant: "destructive"
      });
      
      // If we have cached data even if expired, return it as fallback
      if (cached) {
        console.log("Using expired cache as fallback after error");
        return cached.data;
      }
      
      // Try fallback to popular search if daily trending fails
      return fetchPopularFallback(limit);
    }
  }, [limit, toast]);
  
  // Fallback function to use the previous popular books search method
  const fetchPopularFallback = useCallback(async (limit: number): Promise<Book[]> => {
    console.log(`Using fallback popular books search, limit: ${limit}`);
    
    try {
      // FIX: Use the correct path format for search
      const response = await fetch(`${API_BASE_URL}/search.json?q=popular&sort=rating&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and fetch ISBNs where needed
      const booksPromises = data.docs?.map(async (doc: any) => {
        // Get the best available cover URL
        const coverUrl = doc.cover_i 
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` 
          : (doc.isbn && doc.isbn[0] ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg` : "");
        
        // Extract the first available ISBN (prioritize ISBN-13 if available)
        let isbn = "";
        if (doc.isbn_13 && doc.isbn_13.length > 0) {
          isbn = doc.isbn_13[0];
        } else if (doc.isbn && doc.isbn.length > 0) {
          isbn = doc.isbn[0];
        } else if (doc.key && doc.key.includes("/works/")) {
          // Try to fetch the first edition for this work to get ISBN
          const editionKey = doc.cover_edition_key;
          if (editionKey) {
            try {
              isbn = await fetchISBNFromEditionKey(editionKey);
            } catch (error) {
              console.error("Error fetching ISBN for edition:", error);
            }
          }
        }
        
        return {
          id: doc.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
          title: doc.title || "Unknown Title",
          author: doc.author_name?.[0] || "Unknown Author",
          isbn: isbn,
          coverUrl: coverUrl,
          description: doc.description || "",
          pubDate: doc.first_publish_year?.toString() || "",
          pageCount: doc.number_of_pages_median || 0,
          categories: doc.subject?.slice(0, 3) || ["Popular"],
          author_name: doc.author_name || []
        };
      }) || [];
      
      return await Promise.all(booksPromises);
    } catch (error) {
      console.error("Error in fallback fetch:", error);
      return [];
    }
  }, []);
  
  return {
    fetchTrendingQuery
  };
}
