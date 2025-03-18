
import { useState } from "react";
import { Book, BookActionType } from "@/lib/nostr/types";
import { 
  addBookToList,
  reactToContent,
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
      await addBookToList(book, 'finished');
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
      await addBookToList(book, listType);
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
    handleReactToContent
  };
};
