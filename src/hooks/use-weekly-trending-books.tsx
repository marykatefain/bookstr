
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
    error 
  } = useQuery({
    queryKey: ['weeklyTrendingBooks', limit],
    queryFn: () => getWeeklyTrendingBooks(limit),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 1,
  });

  // Handle errors outside the query config
  useEffect(() => {
    if (error) {
      console.error("Error loading weekly trending books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching trending books.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const refreshBooks = useCallback(() => {
    refetch();
  }, [refetch]);

  return { books, loading, refreshBooks };
}
