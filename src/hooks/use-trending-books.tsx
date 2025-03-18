
import { useCallback, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useTrendingBooks(limit: number = 4) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading: loading, 
    refetch, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['trendingBooks', limit],
    queryFn: () => {
      console.log(`Fetching trending books, limit: ${limit}`);
      return getTrendingBooks(limit);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    initialData: [] // Provide empty array as initial data
  });

  // Handle errors outside the query config
  useEffect(() => {
    if (error) {
      console.error("Error loading featured books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching featured books.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Log when books are loaded successfully
  useEffect(() => {
    if (books.length > 0) {
      console.log(`Successfully loaded ${books.length} trending books`);
    }
  }, [books]);

  const refreshBooks = useCallback(() => {
    console.log("Manually refreshing trending books");
    refetch();
  }, [refetch]);

  return { 
    books, 
    loading: loading || (isFetching && books.length === 0),
    refreshBooks 
  };
}
