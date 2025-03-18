
import { useState, useEffect } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();

  const { 
    data: book = null, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      console.log(`Fetching book details for ISBN: ${isbn}`);
      try {
        const result = await fetchBookByISBN(isbn);
        console.log(`Book data loaded successfully for ISBN: ${isbn}`);
        return result;
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: !!isbn,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });

  // Set read status when book data is available
  useEffect(() => {
    if (book) {
      setIsRead(book.readingStatus?.status === 'finished');
    }
  }, [book]);

  return {
    book,
    loading: isLoading,
    isRead,
    setIsRead
  };
};
