
import { useCallback } from "react";
import { Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { fetchISBNFromEditionKey } from "@/lib/openlibrary/utils";

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
      const books = await Promise.all(data.docs?.map(async (doc: any) => {
        let isbn = doc.isbn?.[0] || "";
        
        // If no ISBN found, try to get it from edition keys
        if (!isbn && doc.edition_key && Array.isArray(doc.edition_key) && doc.edition_key.length > 0) {
          console.log(`No ISBN for "${doc.title}", trying to fetch from edition keys`);
          
          // Try up to 2 editions to avoid too many requests
          const editionsToTry = doc.edition_key.slice(0, 2);
          for (const editionKey of editionsToTry) {
            try {
              const fetchedIsbn = await fetchISBNFromEditionKey(editionKey);
              if (fetchedIsbn) {
                console.log(`Found ISBN ${fetchedIsbn} for "${doc.title}" from edition key ${editionKey}`);
                isbn = fetchedIsbn;
                break;
              }
            } catch (err) {
              console.warn(`Failed to fetch ISBN for "${doc.title}" from edition key ${editionKey}:`, err);
            }
          }
        }
        
        // Generate cover URL based on cover_i or ISBN
        let coverUrl = "";
        if (doc.cover_i) {
          coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
        } else if (isbn) {
          coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        }
        
        return {
          id: doc.key,
          title: doc.title,
          author: doc.author_name?.[0] || "Unknown Author",
          isbn: isbn,
          coverUrl: coverUrl,
          description: doc.description || "",
          pubDate: doc.first_publish_year?.toString() || "",
          pageCount: doc.number_of_pages || 0,
          categories: doc.subject || ["Popular"],
          author_name: doc.author_name || []
        };
      }) || []);
      
      // Filter out books without ISBNs
      const booksWithIsbn = books.filter(book => book.isbn);
      
      // Log results
      console.log(`Processed ${books.length} books, ${booksWithIsbn.length} have ISBNs`);
      
      return booksWithIsbn;
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
