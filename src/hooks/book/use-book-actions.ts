
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

    setPendingAction('finished');
    try {
      // First, check if the book is in TBR or Reading lists and remove it
      if (book.readingStatus?.status === 'tbr') {
        await removeBookFromList(book, 'tbr');
        console.log("Removed book from TBR list before marking as read");
      } else if (book.readingStatus?.status === 'reading') {
        await removeBookFromList(book, 'reading');
        console.log("Removed book from Reading list before marking as read");
      }

      // Try to update the book in the list first, if it fails then add it
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
      // If moving to reading list and book is in TBR, remove from TBR first
      if (listType === 'reading' && book.readingStatus?.status === 'tbr') {
        await removeBookFromList(book, 'tbr');
        console.log("Removed book from TBR list before marking as reading");
      }

      // Try to update the book in the list first, if it fails then add it
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

  const handleRemoveBookFromList = async (book: Book, listType: BookActionType) => {
    if (!book || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to remove books from your list",
        variant: "destructive"
      });
      return;
    }
    
    setPendingAction(listType);
    try {
      await removeBookFromList(book, listType);
      toast({
        title: "Success!",
        description: `Book removed from your ${
          listType === 'tbr' ? 'to be read' : 
          listType === 'reading' ? 'currently reading' : 'finished reading'
        } list.`,
      });
      
      // If removing from "finished" list, update UI to show "not read"
      if (listType === 'finished' && book.readingStatus?.status === 'finished') {
        // This will trigger any UI updates in components that use this hook
        return true;
      }
    } catch (error) {
      console.error(`Error removing book from ${listType} list:`, error);
      toast({
        title: "Error",
        description: "Could not remove book from list",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
    return false;
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
