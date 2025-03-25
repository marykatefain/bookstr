
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchISBNFromEditionKey } from "@/lib/openlibrary/utils";

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
        // Fix the URL format to use the correct path structure and query parameters
        const response = await fetch(`${API_BASE_URL}/trending/daily.json?limit=${limit}`, {
          headers: { 
            'Accept': 'application/json'
          },
          // Use browser cache with a standard strategy
          cache: 'default'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        let responseText;
        try {
          responseText = await response.text();
          const data = JSON.parse(responseText);
          console.log(`Got daily trending data:`, data);
          
          // Handle empty response
          if (!data.works || data.works.length === 0) {
            console.log("No trending books returned from API");
            return [];
          }
          
          // Transform the data into our Book type and fetch missing ISBNs
          const booksPromises = data.works.map(async (work: any) => {
            // Try to get ISBN from availability first
            let isbn = work.availability?.isbn || "";
            
            // If no ISBN available and we have a cover_edition_key, try to fetch ISBN
            if (!isbn && work.cover_edition_key) {
              console.log(`Fetching ISBN for trending book: ${work.title} using edition key: ${work.cover_edition_key}`);
              isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
              console.log(`ISBN fetch result for ${work.title}: ${isbn}`);
            }
            
            // Generate the best cover URL
            const coverUrl = work.cover_id 
              ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
              : (work.cover_edition_key 
                ? `https://covers.openlibrary.org/b/olid/${work.cover_edition_key}-M.jpg`
                : "");
            
            return {
              id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
              title: work.title || "Unknown Title",
              author: work.author_name?.[0] || work.authors?.[0]?.name || "Unknown Author",
              isbn: isbn,
              coverUrl: coverUrl,
              description: work.description?.value || work.description || "",
              pubDate: work.first_publish_year?.toString() || "",
              pageCount: 0,
              categories: ["Trending Today"],
              author_name: work.author_name || (work.authors ? work.authors.map((a: any) => a.name).filter(Boolean) : [])
            };
          });
          
          const books = await Promise.all(booksPromises);
          return books || [];
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError, "Response text:", responseText);
          throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
        }
      } catch (error) {
        console.error("Error fetching daily trending books:", error);
        
        toast({
          title: "Error loading trending books",
          description: "Could not load trending books. Please try again later.",
          variant: "destructive"
        });
        
        // Try a fallback approach
        try {
          // Correct the URL format for the fallback as well
          const fallbackResponse = await fetch(`${API_BASE_URL}/subjects/fiction.json?limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'default'
          });
          
          if (!fallbackResponse.ok) {
            return [];
          }
          
          const fallbackData = await fallbackResponse.json();
          console.log("Using fiction subject as fallback for trending books");
          
          if (!fallbackData.works || fallbackData.works.length === 0) {
            return [];
          }
          
          // Process the fallback results with ISBN fetching
          const fallbackBooksPromises = fallbackData.works.map(async (work: any) => {
            let isbn = work.availability?.isbn || "";
            
            if (!isbn && work.cover_edition_key) {
              isbn = await fetchISBNFromEditionKey(work.cover_edition_key);
            }
            
            return {
              id: work.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
              title: work.title || "Unknown Title",
              author: work.authors?.[0]?.name || "Unknown Author",
              isbn: isbn,
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
            };
          });
          
          return await Promise.all(fallbackBooksPromises);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          return [];
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
