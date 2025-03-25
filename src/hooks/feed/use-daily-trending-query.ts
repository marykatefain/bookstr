
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;
// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

/**
 * Custom hook for fetching daily trending books with proper caching
 */
export function useDailyTrendingQuery(limit: number = 20) {
  const { toast } = useToast();

  const {
    data: books = [],
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['dailyTrending', limit],
    queryFn: async (): Promise<Book[]> => {
      console.log(`Fetching daily trending books, limit: ${limit}`);
      
      try {
        // Use the updated endpoint pattern with the Cloudflare Worker
        const response = await fetch(`${API_BASE_URL}?trending/daily.json&limit=${limit}`, {
          headers: { 
            'Accept': 'application/json'
          },
          // Use browser cache with a standard strategy
          cache: 'default'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // First check if we can parse as JSON
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          console.log("Response starts with:", text.substring(0, 100));
          throw new Error("Invalid JSON response from API");
        }
        
        console.log(`Got daily trending data:`, data);
        
        // Handle empty response
        if (!data.works || data.works.length === 0) {
          console.log("No trending books returned from API");
          return [];
        }
        
        // Transform the data into our Book type
        const books = data.works.map((work: any) => ({
          id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
          title: work.title || "Unknown Title",
          author: work.author_name?.[0] || work.authors?.[0]?.name || "Unknown Author",
          isbn: work.availability?.isbn || "",
          // Fixed cover URL generation
          coverUrl: work.cover_id 
            ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
            : (work.cover_edition_key 
              ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
              : ""),
          description: work.description?.value || work.description || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: ["Trending Today"],
          author_name: work.author_name || [work.authors?.[0]?.name].filter(Boolean)
        }));
        
        return books || [];
      } catch (error) {
        console.error("Error fetching daily trending books:", error);
        
        toast({
          title: "Error loading trending books",
          description: "Could not load trending books. Please try again later.",
          variant: "destructive"
        });
        
        // Try a fallback approach
        try {
          // Fallback to subject search if trending fails
          const fallbackResponse = await fetch(`${API_BASE_URL}?subjects/fiction.json&limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'default'
          });
          
          if (!fallbackResponse.ok) {
            return [];
          }
          
          // Safely parse JSON
          const fallbackText = await fallbackResponse.text();
          let fallbackData;
          
          try {
            fallbackData = JSON.parse(fallbackText);
          } catch (parseError) {
            console.error("Failed to parse fallback JSON:", parseError);
            return [];
          }
          
          console.log("Using fiction subject as fallback for trending books");
          
          if (!fallbackData.works || fallbackData.works.length === 0) {
            return [];
          }
          
          return fallbackData.works.map((work: any) => ({
            id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
            title: work.title || "Unknown Title",
            author: work.authors?.[0]?.name || "Unknown Author",
            isbn: work.availability?.isbn || "",
            coverUrl: work.cover_id 
              ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
              : (work.cover_edition_key 
                ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
                : ""),
            description: work.description?.value || work.description || "",
            pubDate: work.first_publish_year?.toString() || "",
            pageCount: 0,
            categories: ["Popular Fiction"],
            author_name: [work.authors?.[0]?.name].filter(Boolean)
          }));
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          
          // Last resort - try a direct search via the main search API
          try {
            const lastResortResponse = await fetch(`${API_BASE_URL}?q=popular&limit=${limit}`, {
              headers: { 'Accept': 'application/json' },
              cache: 'default'
            });
            
            if (!lastResortResponse.ok) {
              return [];
            }
            
            const lastResortText = await lastResortResponse.text();
            let lastResortData;
            
            try {
              lastResortData = JSON.parse(lastResortText);
            } catch (parseError) {
              console.error("Failed to parse last resort JSON:", parseError);
              return [];
            }
            
            console.log("Using popular search as last resort fallback");
            
            if (!lastResortData.docs || lastResortData.docs.length === 0) {
              return [];
            }
            
            return lastResortData.docs.map((doc: any) => ({
              id: doc.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
              title: doc.title || "Unknown Title",
              author: doc.author_name?.[0] || "Unknown Author",
              isbn: doc.isbn?.[0] || "",
              coverUrl: doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                : "",
              description: "",
              pubDate: doc.first_publish_year?.toString() || "",
              pageCount: doc.number_of_pages_median || 0,
              categories: ["Popular Books"],
              author_name: doc.author_name || []
            }));
          } catch (lastResortError) {
            console.error("All fallbacks failed:", lastResortError);
            return [];
          }
        }
      }
    },
    staleTime: CACHE_TTL, // Cache valid for 10 minutes
    gcTime: CACHE_TTL * 2, // Keep in cache for 20 minutes
    retry: 1, // Only retry once to avoid rate limiting
    refetchOnWindowFocus: false
  });

  // Add debugging to track what's happening with trending books
  console.log(`Trending books from query hook: ${books?.length || 0}`);

  return {
    books,
    isLoading,
    isError,
    error
  };
}
