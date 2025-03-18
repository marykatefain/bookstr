
import { useCallback, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getRecentBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useRecentBooks(limit: number = 4) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading, 
    refetch, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['recentBooks', limit],
    queryFn: async () => {
      console.log(`🔍 Fetching recent books, limit: ${limit}`);
      try {
        const result = await getRecentBooks(limit);
        console.log(`✅ Received ${result.length} recent books`);
        return result;
      } catch (err) {
        console.error("❌ Error fetching recent books:", err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 10 to refresh more often)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    initialData: [] // Provide empty array as initial data
  });

  // Handle errors outside the query config
  useEffect(() => {
    if (error) {
      console.error("Error loading recent books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching recent books.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Log when books are loaded successfully
  useEffect(() => {
    if (books.length > 0) {
      console.log(`Successfully loaded ${books.length} recent books`);
    }
  }, [books]);

  const refreshBooks = useCallback(() => {
    console.log("Manually refreshing recent books");
    refetch();
  }, [refetch]);

  return { 
    books, 
    loading: isLoading || (isFetching && books.length === 0),
    refreshBooks 
  };
}
