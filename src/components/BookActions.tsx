
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Book, BookActionType } from '@/lib/nostr/types';
import { addBookToList, updateBookInList, removeBookFromList, isLoggedIn, rateBook } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { ISBNEntryModal } from './ISBNEntryModal';
import { BookOpen, Eye, Check, X, Star } from "lucide-react";

interface BookActionsProps {
  book: Book;
  onUpdate?: () => void;
  size?: 'small' | 'medium' | 'large';
  horizontal?: boolean;
}

export function BookActions({ book, onUpdate, size = 'medium', horizontal = false }: BookActionsProps) {
  const [isLoading, setIsLoading] = useState<BookActionType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<BookActionType | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [localRating, setLocalRating] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (book.readingStatus?.rating !== undefined) {
      setLocalRating(Math.round(book.readingStatus.rating * 5));
    } else {
      setLocalRating(0);
    }
  }, [book.readingStatus?.rating]);

  const handleAction = async (action: BookActionType) => {
    const isInList = book.readingStatus?.status === action || 
                     (action === 'tbr' && book.readingStatus?.status === 'tbr');
    
    if (isInList) {
      await handleRemoveAction(action);
      return;
    }
    
    if (!book.isbn) {
      setPendingAction(action);
      setShowModal(true);
      return;
    }

    await processBookAction(action, book);
  };

  const removeFromOtherLists = async (bookWithIsbn: Book, targetList: BookActionType) => {
    if (!bookWithIsbn.isbn) return;

    const otherLists = ['tbr', 'reading', 'finished'].filter(list => list !== targetList) as BookActionType[];
    
    for (const listType of otherLists) {
      try {
        if (bookWithIsbn.readingStatus?.status === listType) {
          await removeBookFromList(bookWithIsbn, listType);
          console.log(`Removed book from ${listType} list before adding to ${targetList} list`);
        }
      } catch (error) {
        console.error(`Error removing book from ${listType} list:`, error);
      }
    }
  };

  const processBookAction = async (action: BookActionType, bookWithIsbn: Book) => {
    try {
      setIsLoading(action);
      
      if (!bookWithIsbn.isbn) {
        throw new Error("ISBN is required");
      }
      
      await removeFromOtherLists(bookWithIsbn, action);
      
      const updated = await updateBookInList(bookWithIsbn, action);
      
      if (!updated) {
        await addBookToList(bookWithIsbn, action);
      }
      
      toast({
        title: "Success!",
        description: `Book ${updated ? 'updated in' : 'added to'} your ${action === 'tbr' ? 'to be read' : action === 'reading' ? 'currently reading' : 'finished reading'} list.`,
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Error adding book to ${action} list:`, error);
      toast({
        title: "Error",
        description: `Failed to add book to your list. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRemoveAction = async (action: BookActionType) => {
    try {
      setIsLoading(action);
      
      if (!book.isbn) {
        throw new Error("ISBN is required");
      }
      
      await removeBookFromList(book, action);
      
      toast({
        title: "Success!",
        description: `Book removed from your ${action === 'tbr' ? 'to be read' : action === 'reading' ? 'currently reading' : 'finished reading'} list.`,
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Error removing book from ${action} list:`, error);
      toast({
        title: "Error",
        description: `Failed to remove book from your list. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManualIsbn = (book: Book, isbn: string) => {
    const updatedBook = { ...book, isbn };
    
    if (pendingAction) {
      processBookAction(pendingAction, updatedBook);
      setPendingAction(null);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      setIsRating(true);
      setLocalRating(rating);
      
      if (!book.isbn) {
        throw new Error("ISBN is required");
      }
      
      const normalizedRating = rating / 5;
      await rateBook(book.isbn, normalizedRating);
      
      toast({
        title: "Success!",
        description: `You've rated "${book.title}" ${rating} stars.`,
      });
      
      const updatedBook = {
        ...book,
        readingStatus: {
          ...book.readingStatus,
          rating: normalizedRating
        }
      };
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Error rating book:`, error);
      toast({
        title: "Error",
        description: `Failed to rate the book. Please try again.`,
        variant: "destructive",
      });
      setLocalRating(book.readingStatus?.rating ? Math.round(book.readingStatus.rating * 5) : 0);
    } finally {
      setIsRating(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'h-8 text-xs px-2';
      case 'large': return 'h-12 text-base px-4';
      default: return 'h-10 text-sm px-3';
    }
  };

  const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
  const buttonSize = getButtonSize();
  
  // Changed from grid to flex column
  const containerClass = 'flex flex-col space-y-2 mt-2 w-full';

  const isTbr = book.readingStatus?.status === 'tbr';
  const isReading = book.readingStatus?.status === 'reading';
  const isFinished = book.readingStatus?.status === 'finished';

  const showActionButtons = !isFinished;
  const showUnmarkButton = isFinished;

  return (
    <>
      <div className={containerClass}>
        {showActionButtons && (
          <>
            <Button 
              variant={isTbr ? "secondary" : "outline"} 
              size="sm"
              className={`${buttonSize} w-full`}
              onClick={() => handleAction('tbr')}
              disabled={isLoading !== null}
            >
              {isTbr ? (
                <X size={iconSize} />
              ) : (
                <BookOpen size={iconSize} />
              )}
              {size !== 'small' && <span>{isTbr ? "Remove" : "TBR"}</span>}
            </Button>
            
            <Button 
              variant={isReading ? "secondary" : "outline"} 
              size="sm"
              className={`${buttonSize} w-full`}
              onClick={() => handleAction('reading')}
              disabled={isLoading !== null}
            >
              {isReading ? (
                <X size={iconSize} />
              ) : (
                <Eye size={iconSize} />
              )}
              {size !== 'small' && <span>{isReading ? "Stop" : "Read"}</span>}
            </Button>
          </>
        )}
        
        {showUnmarkButton && (
          <Button 
            variant="outline" 
            size="sm"
            className={`${buttonSize} text-muted-foreground hover:bg-muted/50 w-full`}
            onClick={() => handleAction('finished')}
            disabled={isLoading !== null}
          >
            <X size={iconSize} />
            {size !== 'small' && <span>Mark Unread</span>}
          </Button>
        )}
      </div>

      <ISBNEntryModal
        book={book}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleManualIsbn}
      />
    </>
  );
}

