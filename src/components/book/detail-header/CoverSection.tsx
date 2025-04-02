
import React from "react";
import { Book } from "@/lib/nostr/types";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/book/BookCover";
import { BookStatusButton } from "@/components/book/BookStatusButton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookCoverSectionProps {
  book: Book;
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
  addBookToList: (book: Book, listType: 'tbr' | 'reading') => void;
  handleRemove?: () => void;
}

export const BookCoverSection: React.FC<BookCoverSectionProps> = ({ 
  book, 
  isRead, 
  pendingAction, 
  handleMarkAsRead, 
  addBookToList, 
  handleRemove 
}) => {
  const readingStatus = book.readingStatus?.status;
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const handleAddToTbr = () => addBookToList(book, 'tbr');
  const handleStartReading = () => addBookToList(book, 'reading');
  
  const handleBookshopSearch = () => {
    if (!book.title) {
      toast({
        title: "Cannot find book",
        description: "Book title is missing",
        variant: "destructive"
      });
      return;
    }
    
    // Create the search query with the book title and author if available
    const searchQuery = encodeURIComponent(`${book.title} ${book.author || ''}`);
    // Build the Bookshop.org URL with the affiliate ID
    const bookshopUrl = `https://bookshop.org/beta-search?keywords=${searchQuery}&affiliate=112275`;
    
    window.open(bookshopUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="md:w-1/3">
      <div className="sticky top-20">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md">
          <BookCover
            isbn={book.isbn}
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            size="large"
            book={book}
          />
        </div>
        
        <div className="mt-4 flex flex-col gap-2">
          <BookStatusButton
            book={book}
            pendingAction={pendingAction}
            onAddToTbr={handleAddToTbr}
            onStartReading={handleStartReading}
            onMarkAsRead={handleMarkAsRead}
            onRemove={handleRemove ? () => handleRemove() : undefined}
          />
          
          <Button 
            variant="outline"
            onClick={handleBookshopSearch}
            className="w-full border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy on Bookshop.org
          </Button>
        </div>
      </div>
    </div>
  );
}
