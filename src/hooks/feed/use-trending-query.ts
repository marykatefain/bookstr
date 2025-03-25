
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

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
      // Use the trending/daily API via Cloudflare Worker
      const response = await fetch(`${API_BASE_URL}?trending/daily.json&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Got daily trending data: ${data.works?.length || 0} results`);
      
      // Only extract necessary fields to reduce transformation overhead
      const books = data.works?.map((work: any) => {
        // Determine the best cover URL
        let coverUrl = work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : (work.cover_edition_key 
            ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
            : "");
          
        // Get ISBN if available
        let isbn = "";
        if (work.availability?.isbn) {
          isbn = work.availability.isbn;
        }
        
        return {
          id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
          title: work.title || "Unknown Title",
          author: work.authors?.[0]?.name || "Unknown Author",
          isbn: isbn,
          coverUrl: coverUrl,
          description: work.description?.value || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: ["Trending Today"],
          author_name: work.authors?.map((a: any) => a.name) || []
        };
      }) || [];
      
      // Cache the results
      queryCache[cacheKey] = {
        timestamp: now,
        data: books
      };
      
      return books;
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
      const response = await fetch(`${API_BASE_URL}?q=popular&sort=rating&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const books = data.docs?.map((doc: any) => {
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
      
      return books;
    } catch (error) {
      console.error("Error in fallback fetch:", error);
      return [];
    }
  }, []);
  
  return {
    fetchTrendingQuery
  };
}
