
import { useState, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { getTrendingBooks } from "@/lib/openlibrary";
import { useToast } from "@/hooks/use-toast";

export function useTrendingBooks(limit: number = 3) {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const books = await getTrendingBooks(limit);
      setBooks(books);
    } catch (error) {
      console.error("Error loading featured books:", error);
      toast({
        title: "Error loading books",
        description: "There was a problem fetching featured books.",
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
