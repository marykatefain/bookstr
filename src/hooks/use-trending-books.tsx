
import { useState, useEffect, useCallback } from "react";
import { Book } from "@/lib/nostr/types";
import { getTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useTrendingBooks(limit: number = 3) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading: loading, 
    refetch, 
    error 
  } = useQuery({
    queryKey: ['trendingBooks', limit],
    queryFn: () => getTrendingBooks(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
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

  const refreshBooks = useCallback(() => {
    refetch();
  }, [refetch]);

  return { books, loading, refreshBooks };
}
