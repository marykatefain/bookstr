
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
    queryFn: () => getWeeklyTrendingBooks(limit),
    staleTime: 30 * 60 * 1000, // 30 minutes (reduced from 60 to keep data fresher)
    gcTime: 120 * 60 * 1000, // 2 hours
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 3000 : 1000, 30 * 1000),
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
    refetch();
  }, [refetch]);

  return { 
    books, 
    loading: loading || (isFetching && books.length === 0), // Only show loading state if no data
    refreshBooks 
  };
}
