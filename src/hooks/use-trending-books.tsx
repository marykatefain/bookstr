
import { useCallback } from "react";
import { getTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useTrendingBooks(limit: number = 3) {
  const { toast } = useToast();

  const { 
    data: books = [], 
    isLoading, 
    refetch, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['trendingBooks', limit],
    queryFn: async () => {
      console.log(`Fetching trending books, limit: ${limit}`);
      try {
        const result = await getTrendingBooks(limit);
        console.log(`Received ${result.length} trending books`);
        return result;
      } catch (err) {
        console.error("Error fetching trending books:", err);
        toast({
          title: "Error loading books",
          description: "There was a problem fetching trending books.",
          variant: "destructive"
        });
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    initialData: []
  });

  const refreshBooks = useCallback(() => {
    console.log("Manually refreshing trending books");
    refetch();
  }, [refetch]);

  return { 
    books, 
    loading: isLoading || (isFetching && books.length === 0),
    refreshBooks 
  };
}
