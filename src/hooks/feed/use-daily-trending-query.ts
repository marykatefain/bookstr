
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

// Cache for storing query results to avoid repeated requests
const dailyTrendingCache: {
  timestamp: number;
  data: Book[];
} = {
  timestamp: 0,
  data: []
};

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Custom hook for fetching daily trending books
 */
export function useDailyTrendingQuery(limit: number = 20) {
  const { toast } = useToast();
  
  const fetchDailyTrending = useCallback(async (): Promise<Book[]> => {
    console.log(`Fetching daily trending books, limit: ${limit}`);
    
    // If we have cached data less than CACHE_TTL old, use it
    const now = Date.now();
    if (dailyTrendingCache.data.length > 0 && (now - dailyTrendingCache.timestamp < CACHE_TTL)) {
      console.log("Using cached daily trending results");
      return dailyTrendingCache.data.slice(0, limit);
    }
    
    try {
      // Use the trending/daily API
      const response = await fetch(`https://openlibrary.org/trending/daily.json?limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
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
          : "";
          
        // Get ISBN if available
        let isbn = work.availability?.isbn || "";
        
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
      
      // Update cache
      dailyTrendingCache.data = books;
      dailyTrendingCache.timestamp = now;
      
      return books.slice(0, limit);
    } catch (error) {
      console.error("Error fetching daily trending books:", error);
      
      // Show error toast only for initial load errors when cache is empty
      if (dailyTrendingCache.data.length === 0) {
        toast({
          title: "Error loading books",
          description: "There was a problem fetching trending books.",
          variant: "destructive"
        });
      }
      
      // If we have cached data, use it as fallback even if expired
      if (dailyTrendingCache.data.length > 0) {
        console.log("Using expired cache as fallback after error");
        return dailyTrendingCache.data.slice(0, limit);
      }
      
      return [];
    }
  }, [limit, toast]);
  
  return { fetchDailyTrending };
}
