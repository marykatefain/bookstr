
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, addBookToTBR, markBookAsReading, markBookAsRead, removeBookFromList } from "@/lib/nostr";

import { BookCover } from "./book/BookCover";
import { BookRating } from "./book/BookRating";
import { BookCategories } from "./book/BookCategories";
import { BookActionButtons } from "./book/BookActionButtons";
import { BookActions } from "./BookActions";

interface BookCardProps {
  book: Book;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  showRating?: boolean;
  showCategories?: boolean;
  onUpdate?: () => void;
  variant?: "horizontal" | "vertical";
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  size = "medium",
  showDescription = false,
  showRating = true,
  showCategories = true,
  onUpdate,
  variant = "vertical",
  className = ""
}) => {
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRead, setIsRead] = useState(book.readingStatus?.status === 'finished');
  const [localBook, setLocalBook] = useState<Book>(book);

  useEffect(() => {
    setLocalBook(book);
    setIsRead(book.readingStatus?.status === 'finished');
  }, [book]);

  const getCardClasses = () => {
    const baseClasses = "overflow-hidden h-full";
    
    const layoutClasses = variant === "horizontal" 
      ? "flex flex-row" 
      : "flex flex-col";
    
    let sizeClasses = "";
    if (size === "small") sizeClasses = "max-w-[220px] w-full";
    else if (size === "large") sizeClasses = "max-w-[280px] w-full";
    else sizeClasses = "w-full"; // medium size - no max width, full responsive width
    
    return `${baseClasses} ${layoutClasses} ${sizeClasses} ${className}`;
  };

  const getTitleClasses = () => {
    const baseClasses = "font-bold font-serif truncate";
    if (size === "small") return `${baseClasses} text-xs`;
    if (size === "large") return `${baseClasses} text-lg`;
    return `${baseClasses} text-sm`; // medium size
  };

  const handleAction = async (action: 'tbr' | 'reading' | 'finished') => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to add books to your library",
        variant: "destructive"
      });
      return;
    }

    if (!book.isbn) {
      toast({
        title: "Invalid book data",
        description: "This book is missing an ISBN and cannot be added to your library",
        variant: "destructive"
      });
      return;
    }

    setPendingAction(action);

    try {
      let result: string | null;
      
      if (action === 'tbr') {
        result = await addBookToTBR(book);
      } else if (action === 'reading') {
        result = await markBookAsReading(book);
      } else if (action === 'finished') {
        result = await markBookAsRead(book);
        setIsRead(true);
      }

      if (result) {
        let statusText = action === 'tbr' ? 'TBR' : action === 'reading' ? 'currently reading' : 'read';
        toast({
          title: `Added to your ${statusText} list`,
          description: `${book.title} has been added to your library and published to Nostr`
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemove = async (listType: 'tbr' | 'reading' | 'finished') => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to remove books from your library",
        variant: "destructive"
      });
      return;
    }

    if (!book.isbn) {
      toast({
        title: "Invalid book data",
        description: "This book is missing an ISBN and cannot be removed from your library",
        variant: "destructive"
      });
      return;
    }

    setPendingAction(listType);

    try {
      await removeBookFromList(book, listType);
      
      let statusText = listType === 'tbr' ? 'TBR' : listType === 'reading' ? 'currently reading' : 'read';
      toast({
        title: `Removed from your ${statusText} list`,
        description: `${book.title} has been removed from your ${statusText} list`
      });
      
      if (listType === 'finished') {
        setIsRead(false);
      }
      
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

  const handleBookUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  const coverContainerClasses = variant === "horizontal"
    ? "relative flex-shrink-0" + (size === "small" ? " w-16 h-16" : " w-24 h-24")
    : "relative" + (variant === "vertical" ? " style={{ paddingTop: '150%' }}" : "");

  const contentContainerClasses = variant === "horizontal"
    ? "p-2 space-y-1 flex-grow"
    : "p-3 space-y-1.5 flex-grow";

  let mappedReadingStatus: 'tbr' | 'reading' | 'finished' | null = null;
  
  if (localBook.readingStatus?.status === 'tbr') {
    mappedReadingStatus = 'tbr';
  } else if (localBook.readingStatus?.status === 'reading') {
    mappedReadingStatus = 'reading';
  } else if (localBook.readingStatus?.status === 'finished') {
    mappedReadingStatus = 'finished';
  }

  // Get author display name, ensuring we have something to show
  const authorDisplayName = localBook.author || "Unknown Author";
  
  // Get the user's rating for the book, if any
  const userRating = localBook.readingStatus?.rating;

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0 flex flex-col h-full">
        {variant === "horizontal" ? (
          <div className="flex flex-row h-full">
            <div className={coverContainerClasses}>
              <BookCover 
                isbn={localBook.isbn}
                title={localBook.title}
                author={authorDisplayName}
                coverUrl={localBook.coverUrl}
                isRead={isRead}
                pendingAction={pendingAction}
                onReadAction={() => handleAction('finished')}
                size={size}
                userRating={userRating}
              />
            </div>
            
            <div className={contentContainerClasses}>
              <h3 className={getTitleClasses()}>
                <Link 
                  to={`/book/${localBook.isbn}`}
                  className="hover:text-bookverse-accent transition-colors"
                >
                  {localBook.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {authorDisplayName}</p>
              
              {showRating && (
                <BookRating rating={localBook.readingStatus?.rating} />
              )}
              
              {showCategories && size !== "small" && (
                <BookCategories categories={localBook.categories} />
              )}
              
              <BookActionButtons
                size={size}
                pendingAction={pendingAction}
                onAddToTbr={() => handleAction('tbr')}
                onStartReading={() => handleAction('reading')}
                onRemove={handleRemove}
                readingStatus={mappedReadingStatus}
                book={localBook}
                onUpdate={handleBookUpdate}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="relative" style={{ paddingTop: "150%" }}>
              <div className="absolute inset-0">
                <BookCover 
                  isbn={localBook.isbn}
                  title={localBook.title}
                  author={authorDisplayName}
                  coverUrl={localBook.coverUrl}
                  isRead={isRead}
                  pendingAction={pendingAction}
                  onReadAction={() => handleAction('finished')}
                  size={size}
                  userRating={userRating}
                />
              </div>
            </div>
            
            <div className={contentContainerClasses}>
              <h3 className={getTitleClasses()}>
                <Link 
                  to={`/book/${localBook.isbn}`}
                  className="hover:text-bookverse-accent transition-colors"
                >
                  {localBook.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {authorDisplayName}</p>
              
              {showRating && (
                <BookRating rating={localBook.readingStatus?.rating} />
              )}
              
              {showCategories && (
                <BookCategories categories={localBook.categories} />
              )}
              
              {showDescription && localBook.description && (
                <p className="text-xs line-clamp-2">{localBook.description}</p>
              )}
              
              <BookActions
                book={localBook}
                onUpdate={handleBookUpdate}
                size={size}
                horizontal={true}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
