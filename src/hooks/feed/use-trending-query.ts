
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for fetching popular books with a specified query
 */
export function useTrendingQuery(limit: number = 20) {
  const { toast } = useToast();
  
  const fetchTrendingQuery = useCallback(async (): Promise<Book[]> => {
    console.log(`Fetching popular books sorted by rating, limit: ${limit}`);
    
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=popular&sort=rating&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Got trending query data: ${data.docs?.length || 0} results`);
      
      // Transform the search results into Book objects
      const books = data.docs?.map((doc: any) => ({
        id: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || "Unknown Author",
        isbn: doc.isbn?.[0] || "",
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
        description: doc.description || "",
        pubDate: doc.first_publish_year?.toString() || "",
        pageCount: doc.number_of_pages || 0,
        categories: doc.subject || ["Popular"],
        author_name: doc.author_name || []
      })) || [];
      
      return books;
    } catch (error) {
      console.error("Error fetching trending query books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching popular books.",
        variant: "destructive"
      });
      return [];
    }
  }, [limit, toast]);
  
  return {
    fetchTrendingQuery
  };
}
