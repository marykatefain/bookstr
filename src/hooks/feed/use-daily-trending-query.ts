
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

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
        const response = await fetch(`https://openlibrary.org/trending/daily.json?limit=${limit}`, {
          headers: { 
            'Accept': 'application/json',
            'mode': 'no-cors'  // Handle CORS issues
          },
          cache: 'no-store'
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
          coverUrl: work.cover_id 
            ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
            : "",
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
    gcTime: CACHE_TTL * 2, // Keep in cache for 20 minutes (previously cacheTime)
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
