
import { useState } from "react";
import { Book, BookActionType } from "@/lib/nostr/types";
import { 
  addBookToList,
  updateBookInList,
  removeBookFromList,
  isLoggedIn
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

export const useBookActions = () => {
  const [pendingAction, setPendingAction] = useState<BookActionType | null>(null);
  const { toast } = useToast();

  const handleMarkAsRead = async (book: Book | null, setIsRead: (isRead: boolean) => void) => {
    if (!book || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to mark books as read",
        variant: "destructive"
      });
      return;
    }

    const currentStatus = book.readingStatus?.status;
    
    if (currentStatus === 'finished') {
      console.log("Book is already marked as read, removing from finished list");
      setPendingAction('finished');
      
      try {
        // Attempt to remove the book from the finished list
        const result = await removeBookFromList(book, 'finished');
        
        if (result) {
          console.log("Successfully removed book from finished list", result);
          setIsRead(false);
          toast({
            title: "Success!",
            description: "Book removed from your read list",
          });
        } else {
          console.log("Book was not found in the finished list or removal failed");
          toast({
            title: "Note",
            description: "The book could not be removed from your read list",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error removing book from finished list:", error);
        toast({
          title: "Error",
          description: "Could not remove book from read list",
          variant: "destructive"
        });
      } finally {
        setPendingAction(null);
      }
      return;
    }

    setPendingAction('finished');
    try {
      if (currentStatus === 'tbr') {
        await removeBookFromList(book, 'tbr');
        console.log("Removed book from TBR list before marking as read");
      } else if (currentStatus === 'reading') {
        await removeBookFromList(book, 'reading');
        console.log("Removed book from Reading list before marking as read");
      }

      const success = await updateBookInList(book, 'finished');
      if (!success) {
        await addBookToList(book, 'finished');
      }
      setIsRead(true);
      toast({
        title: "Success!",
        description: "Book marked as read",
      });
    } catch (error) {
      console.error("Error marking book as read:", error);
      toast({
        title: "Error",
        description: "Could not mark book as read",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddBookToList = async (book: Book, listType: 'tbr' | 'reading') => {
    if (!book) return;
    
    setPendingAction(listType);
    try {
      if (listType === 'reading' && book.readingStatus?.status === 'tbr') {
        await removeBookFromList(book, 'tbr');
        console.log("Removed book from TBR list before marking as reading");
      }

      const success = await updateBookInList(book, listType);
      if (!success) {
        await addBookToList(book, listType);
      }
      toast({
        title: "Success!",
        description: `Book added to your ${listType === 'tbr' ? 'to be read' : 'currently reading'} list.`,
      });
    } catch (error) {
      console.error(`Error adding book to ${listType} list:`, error);
      toast({
        title: "Error",
        description: "Could not add book to list",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveBookFromList = async (book: Book, listType: BookActionType): Promise<boolean> => {
    if (!book || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to remove books from your list",
        variant: "destructive"
      });
      return false;
    }
    
    setPendingAction(listType);
    try {
      console.log(`Removing book ${book.title} (ISBN: ${book.isbn}) from ${listType} list`);
      const result = await removeBookFromList(book, listType);
      
      if (result) {
        toast({
          title: "Success!",
          description: `Book removed from your ${
            listType === 'tbr' ? 'to be read' : 
            listType === 'reading' ? 'currently reading' : 'finished reading'
          } list.`,
        });
        return true;
      } else {
        toast({
          title: "Note",
          description: "Book was not found in the list",
        });
        return false;
      }
    } catch (error) {
      console.error(`Error removing book from ${listType} list:`, error);
      toast({
        title: "Error",
        description: "Could not remove book from list",
        variant: "destructive"
      });
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleReactToContent = async (contentId: string) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await reactToContent(contentId);
      toast({
        title: "Reaction sent",
        description: "You've reacted to this content"
      });
    } catch (error) {
      console.error("Error reacting to content:", error);
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
    }
  };

  return {
    pendingAction,
    handleMarkAsRead,
    handleAddBookToList,
    handleRemoveBookFromList,
    handleReactToContent
  };
};

// Re-adding the import for reactToContent that was previously fixed
import { reactToContent } from "@/lib/nostr";
