
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Book, BookActionType } from '@/lib/nostr/types';
import { addBookToList } from "@/lib/nostr/books";
import { toast } from "@/hooks/use-toast";
import { ISBNEntryModal } from './ISBNEntryModal';
import { BookList, Eye, EyeOff, Check } from "lucide-react";

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

  const handleAction = async (action: BookActionType) => {
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
      
      await addBookToList(bookWithIsbn, action);
      
      toast({
        title: "Success!",
        description: `Book added to your ${action === 'tbr' ? 'to be read' : action === 'reading' ? 'currently reading' : 'finished reading'} list.`,
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

  const handleManualIsbn = (book: Book, isbn: string) => {
    const updatedBook = { ...book, isbn };
    
    if (pendingAction) {
      processBookAction(pendingAction, updatedBook);
      setPendingAction(null);
    }
  };

  // Style variations based on size
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

  return (
    <>
      <div className={containerClass}>
        <Button 
          variant="outline" 
          size="sm"
          className={buttonSize}
          onClick={() => handleAction('tbr')}
          disabled={isLoading !== null}
        >
          <BookList size={iconSize} />
          {size !== 'small' && <span>To Be Read</span>}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className={buttonSize}
          onClick={() => handleAction('reading')}
          disabled={isLoading !== null}
        >
          <Eye size={iconSize} />
          {size !== 'small' && <span>Start Reading</span>}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className={buttonSize}
          onClick={() => handleAction('finished')}
          disabled={isLoading !== null}
        >
          <Check size={iconSize} />
          {size !== 'small' && <span>Finished</span>}
        </Button>
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
