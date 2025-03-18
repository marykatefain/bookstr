
import { useState, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

export const useBookData = (isbn: string | undefined) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!isbn) return;
      
      setLoading(true);
      try {
        const bookData = await fetchBookByISBN(isbn);
        if (bookData) {
          setBook(bookData);
          setIsRead(bookData.readingStatus?.status === 'finished');
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
        toast({
          title: "Error",
          description: "Could not load book details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isbn, toast]);

  return {
    book,
    loading,
    isRead,
    setIsRead
  };
};
