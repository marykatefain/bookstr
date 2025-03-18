
import { useCallback, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getWeeklyTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useWeeklyTrendingBooks(limit: number = 20) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading: loading, 
    refetch, 
    error,
    isFetching 
  } = useQuery({
    queryKey: ['weeklyTrendingBooks', limit],
    queryFn: () => {
      console.log(`Fetching weekly trending books, limit: ${limit}`);
      return getWeeklyTrendingBooks(limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (reduced to refresh more often)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    initialData: [] // Provide empty array as initial data to avoid undefined
  });

  // Handle errors outside the query config
  useEffect(() => {
    if (error) {
      console.error("Error loading weekly trending books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching trending books. Showing cached results.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const refreshBooks = useCallback(() => {
    console.log("Manually refreshing weekly trending books");
    refetch();
  }, [refetch]);

  // Log when books are loaded successfully
  useEffect(() => {
    if (books.length > 0) {
      console.log(`Successfully loaded ${books.length} weekly trending books`);
    }
  }, [books]);

  return { 
    books, 
    loading: loading || (isFetching && books.length === 0), // Only show loading state if no data
    refreshBooks 
  };
}
