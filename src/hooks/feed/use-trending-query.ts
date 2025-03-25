
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

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
 * Custom hook for fetching popular books with a specified query
 */
export function useTrendingQuery(limit: number = 20) {
  const { toast } = useToast();
  
  const fetchTrendingQuery = useCallback(async (): Promise<Book[]> => {
    console.log(`Fetching popular books sorted by rating, limit: ${limit}`);
    
    // Check cache first
    const cacheKey = `popular_${limit}`;
    const now = Date.now();
    const cached = queryCache[cacheKey];
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log("Using cached trending query results");
      return cached.data;
    }
    
    try {
      // Build the query URL with minimal parameters needed
      const response = await fetch(`https://openlibrary.org/search.json?q=popular&sort=rating&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Got trending query data: ${data.docs?.length || 0} results`);
      
      // Only extract necessary fields to reduce transformation overhead
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
      
      // Cache the results
      queryCache[cacheKey] = {
        timestamp: now,
        data: books
      };
      
      return books;
    } catch (error) {
      console.error("Error fetching trending query books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching popular books.",
        variant: "destructive"
      });
      
      // If we have cached data even if expired, return it as fallback
      if (cached) {
        console.log("Using expired cache as fallback after error");
        return cached.data;
      }
      
      return [];
    }
  }, [limit, toast]);
  
  return {
    fetchTrendingQuery
  };
}
