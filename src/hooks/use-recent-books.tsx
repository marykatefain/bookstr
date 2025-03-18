
import { useState, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getRecentBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";

export function useRecentBooks(limit: number = 3) {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const books = await getRecentBooks(limit);
      setBooks(books);
    } catch (error) {
      console.error("Error loading recent books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching recent books.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [toast, limit]);

  return { books, loading, refreshBooks: loadBooks };
}
