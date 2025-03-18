
import { useCallback, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getRecentBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useRecentBooks(limit: number = 4) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading: loading, 
    refetch, 
    error 
  } = useQuery({
    queryKey: ['recentBooks', limit],
    queryFn: () => getRecentBooks(limit),
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 120 * 60 * 1000, // 2 hours
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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

  const refreshBooks = useCallback(() => {
    refetch();
  }, [refetch]);

  return { books, loading, refreshBooks };
}
