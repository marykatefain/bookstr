
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Book, BookActionType } from '@/lib/nostr/types';
import { addBookToList, updateBookInList, removeBookFromList, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { ISBNEntryModal } from './ISBNEntryModal';
import { BookOpen, Eye, Check, X } from "lucide-react";

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
  const { toast } = useToast();

  const handleAction = async (action: BookActionType) => {
    // Check if book is already in this list
    const isInList = book.readingStatus?.status === action || 
                     (action === 'tbr' && book.readingStatus?.status === 'tbr');
    
    // If book is already in the list, remove it
    if (isInList) {
      await handleRemoveAction(action);
      return;
    }
    
    // If no ISBN, request manual entry
    if (!book.isbn) {
      setPendingAction(action);
      setShowModal(true);
      return;
    }

    await processBookAction(action, book);
  };

  const processBookAction = async (action: BookActionType, bookWithIsbn: Book) => {
    try {
      setIsLoading(action);
      
      if (!bookWithIsbn.isbn) {
        throw new Error("ISBN is required");
      }
      
      // First try to update the book in an existing list
      const updated = await updateBookInList(bookWithIsbn, action);
      
      // If no existing list was found, add the book to a new list
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

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'h-8 text-xs px-2';
      case 'large': return 'h-12 text-base px-4';
      default: return 'h-10 text-sm px-3';
    }
  };

  const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
  const buttonSize = getButtonSize();
  const containerClass = horizontal 
    ? 'flex flex-row space-x-2 mt-2' 
    : 'flex flex-col space-y-2 mt-2';

  const isTbr = book.readingStatus?.status === 'tbr';
  const isReading = book.readingStatus?.status === 'reading';
  const isFinished = book.readingStatus?.status === 'finished';

  // Determine which buttons to show based on reading status
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
              className={buttonSize}
              onClick={() => handleAction('tbr')}
              disabled={isLoading !== null}
            >
              {isTbr ? (
                <X size={iconSize} />
              ) : (
                <BookOpen size={iconSize} />
              )}
              {size !== 'small' && <span>{isTbr ? "Remove from TBR" : "To Be Read"}</span>}
            </Button>
            
            <Button 
              variant={isReading ? "secondary" : "outline"} 
              size="sm"
              className={buttonSize}
              onClick={() => handleAction('reading')}
              disabled={isLoading !== null}
            >
              {isReading ? (
                <X size={iconSize} />
              ) : (
                <Eye size={iconSize} />
              )}
              {size !== 'small' && <span>{isReading ? "Stop Reading" : "Start Reading"}</span>}
            </Button>
          </>
        )}
        
        {showUnmarkButton && (
          <Button 
            variant="secondary" 
            size="sm"
            className={buttonSize}
            onClick={() => handleAction('finished')}
            disabled={isLoading !== null}
          >
            <X size={iconSize} />
            {size !== 'small' && <span>Unmark as Read</span>}
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
