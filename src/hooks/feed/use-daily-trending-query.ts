
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
        
        const data = await response.json();
        console.log(`Got daily trending data: ${data.works?.length || 0} results`);
        
        // Transform the data into our Book type
        const books = data.works?.map((work: any) => ({
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
          description: work.description?.value || "",
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
        
        return [];
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
