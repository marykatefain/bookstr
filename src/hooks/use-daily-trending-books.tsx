
import { useCallback, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getDailyTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useDailyTrendingBooks(limit: number = 4) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading: loading, 
    refetch, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['dailyTrendingBooks', limit],
    queryFn: () => getDailyTrendingBooks(limit),
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
      console.error("Error loading top today books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching today's top books.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const refreshBooks = useCallback(() => {
    refetch();
  }, [refetch]);

  return { 
    books, 
    loading: loading || (isFetching && books.length === 0),
    refreshBooks 
  };
}
