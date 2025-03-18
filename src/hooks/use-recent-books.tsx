
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
    error,
    isFetching
  } = useQuery({
    queryKey: ['recentBooks', limit],
    queryFn: () => {
      console.log(`Fetching recent books, limit: ${limit}`);
      return getRecentBooks(limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
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
    loading: loading || (isFetching && books.length === 0),
    refreshBooks 
  };
}
