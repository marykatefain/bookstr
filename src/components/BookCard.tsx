
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { 
  isLoggedIn, 
  addBookToTBR, 
  markBookAsReading, 
  markBookAsRead, 
  removeBookFromList, 
  rateBook 
} from "@/lib/nostr";
import { Rating } from "@/lib/utils/Rating";

import { BookCover } from "./book/BookCover";
import { BookStatusButton } from "./book/BookStatusButton";
import { ISBNEntryModal } from "./ISBNEntryModal";
import { X, Loader2 } from "lucide-react";

interface BookCardProps {
  book: Book;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  showRating?: boolean;
  variant?: "horizontal" | "vertical";
  className?: string;
  onUpdate?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  size = "medium",
  showDescription = false,
  showRating = true,
  variant = "vertical",
  className = "",
  onUpdate
}) => {
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<'tbr' | 'reading' | 'finished' | null>(null);
  const [localBook, setLocalBook] = useState<Book>(book);

  useEffect(() => {
    setLocalBook(book);
  }, [book]);

  const getCardClasses = () => {
    const baseClasses = "overflow-hidden h-full";
    
    const layoutClasses = variant === "horizontal" 
      ? "flex flex-row" 
      : "flex flex-col";
    
    let sizeClasses = "";
    if (size === "small") sizeClasses = "max-w-[180px] w-full";
    else if (size === "large") sizeClasses = "max-w-[240px] w-full";
    else sizeClasses = "max-w-[210px] w-full";
    
    return `${baseClasses} ${layoutClasses} ${sizeClasses} ${className}`;
  };

  const getTitleClasses = () => {
    const baseClasses = "font-bold font-serif truncate";
    if (size === "small") return `${baseClasses} text-xs`;
    if (size === "large") return `${baseClasses} text-base`;
    return `${baseClasses} text-sm`;
  };
  
  const checkLogin = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to add books to your library",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  
  const checkIsbn = () => {
    if (!localBook.isbn) {
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleAddToTBR = async () => {
    if (!checkLogin() || !checkIsbn()) {
      setPendingActionType('tbr');
      return;
    }

    setPendingAction('tbr');
    
    try {
      await removeFromOtherLists('tbr');
      const result = await addBookToTBR(localBook);
      
      if (result) {
        toast({
          title: "Added to your TBR list",
          description: `${localBook.title} has been added to your library`
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error adding book to TBR:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleStartReading = async () => {
    if (!checkLogin() || !checkIsbn()) {
      setPendingActionType('reading');
      return;
    }

    setPendingAction('reading');
    
    try {
      await removeFromOtherLists('reading');
      const result = await markBookAsReading(localBook);
      
      if (result) {
        toast({
          title: "Added to your reading list",
          description: `${localBook.title} has been added to your reading list`
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error marking book as reading:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleMarkAsRead = async () => {
    if (!checkLogin() || !checkIsbn()) {
      setPendingActionType('finished');
      return;
    }

    setPendingAction('finished');
    
    try {
      await removeFromOtherLists('finished');
      const result = await markBookAsRead(localBook);
      
      if (result) {
        toast({
          title: "Marked as read",
          description: `${localBook.title} has been marked as read`
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error marking book as read:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemove = async () => {
    if (!checkLogin()) return;
    
    const status = localBook.readingStatus?.status;
    if (!status) return;
    
    setPendingAction(status);
    
    try {
      await removeBookFromList(localBook, status);
      
      let statusText = status === 'tbr' ? 'TBR' : status === 'reading' ? 'reading' : 'finished reading';
      toast({
        title: `Removed from your ${statusText} list`,
        description: `${localBook.title} has been removed from your ${statusText} list`
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing book:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };
  
  const handleRating = async (rating: Rating) => {
    if (!checkLogin() || !checkIsbn()) return;

    try {
      await rateBook(localBook.isbn, rating);
      
      toast({
        title: "Rating saved",
        description: `Your rating for ${localBook.title} has been saved`
      });
      
      setLocalBook(prev => ({
        ...prev,
        readingStatus: {
          ...prev.readingStatus!,
          rating
        }
      }));
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error rating book:", error);
      toast({
        title: "Rating failed",
        description: "There was an error saving your rating",
        variant: "destructive"
      });
    }
  };
  
  const removeFromOtherLists = async (targetList: 'tbr' | 'reading' | 'finished') => {
    if (!localBook.isbn) return;
    
    const currentStatus = localBook.readingStatus?.status;
    if (currentStatus && currentStatus !== targetList) {
      try {
        await removeBookFromList(localBook, currentStatus);
      } catch (error) {
        console.error(`Error removing book from ${currentStatus} list:`, error);
      }
    }
  };
  
  const handleManualIsbn = (book: Book, isbn: string) => {
    const updatedBook = { ...book, isbn };
    setLocalBook(updatedBook);
    
    if (pendingActionType === 'tbr') {
      handleAddToTBR();
    } else if (pendingActionType === 'reading') {
      handleStartReading();
    } else if (pendingActionType === 'finished') {
      handleMarkAsRead();
    }
    setPendingActionType(null);
  };

  const bookTitle = localBook.title || `Book (ISBN: ${localBook.isbn || "Unknown"})`;
  const authorDisplayName = localBook.author || "Unknown Author";

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0 flex flex-col h-full">
        {variant === "horizontal" ? (
          <div className="flex flex-row h-full">
            <div className={`relative flex-shrink-0 ${size === "small" ? "w-16 h-24" : "w-24 h-36"}`}>
              {localBook.readingStatus?.status && (
                <button 
                  onClick={handleRemove}
                  disabled={!!pendingAction}
                  className="absolute top-1 left-1 z-10 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  aria-label="Remove from list"
                >
                  {pendingAction ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              )}
              <BookCover 
                isbn={localBook.isbn}
                title={bookTitle}
                author={authorDisplayName}
                coverUrl={localBook.coverUrl}
                size={size}
              />
            </div>
            
            <div className="p-2 space-y-2 flex-grow">
              <h3 className={getTitleClasses()}>
                {localBook.isbn ? (
                  <Link 
                    to={`/book/${localBook.isbn}`}
                    className="hover:text-bookverse-accent transition-colors"
                  >
                    {bookTitle}
                  </Link>
                ) : (
                  <span>{bookTitle}</span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {authorDisplayName}</p>
              
              {showDescription && localBook.description && (
                <p className="text-xs line-clamp-2 text-gray-600 dark:text-gray-300">{localBook.description}</p>
              )}
              
              <BookStatusButton
                book={localBook}
                pendingAction={pendingAction}
                onAddToTbr={handleAddToTBR}
                onStartReading={handleStartReading}
                onMarkAsRead={handleMarkAsRead}
                onRemove={handleRemove}
                onRatingChange={handleRating}
                horizontal={true}
                size={size}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="relative" style={{ paddingTop: "150%" }}>
              {localBook.readingStatus?.status && (
                <button 
                  onClick={handleRemove}
                  disabled={!!pendingAction}
                  className="absolute top-1 left-1 z-10 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  aria-label="Remove from list"
                >
                  {pendingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
              <div className="absolute inset-0">
                <BookCover 
                  isbn={localBook.isbn}
                  title={bookTitle}
                  author={authorDisplayName}
                  coverUrl={localBook.coverUrl}
                  size={size}
                />
              </div>
            </div>
            
            <div className="p-3 space-y-2 flex-grow">
              <h3 className={getTitleClasses()}>
                {localBook.isbn ? (
                  <Link 
                    to={`/book/${localBook.isbn}`}
                    className="hover:text-bookverse-accent transition-colors"
                  >
                    {bookTitle}
                  </Link>
                ) : (
                  <span>{bookTitle}</span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {authorDisplayName}</p>
              
              {showDescription && localBook.description && (
                <p className="text-xs line-clamp-2 text-gray-600 dark:text-gray-300">{localBook.description}</p>
              )}
              
              <BookStatusButton
                book={localBook}
                pendingAction={pendingAction}
                onAddToTbr={handleAddToTBR}
                onStartReading={handleStartReading}
                onMarkAsRead={handleMarkAsRead}
                onRemove={handleRemove}
                onRatingChange={handleRating}
                size={size}
              />
            </div>
          </>
        )}
      </CardContent>
      
      <ISBNEntryModal
        book={localBook}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingActionType(null);
        }}
        onSubmit={handleManualIsbn}
      />
    </Card>
  );
};
