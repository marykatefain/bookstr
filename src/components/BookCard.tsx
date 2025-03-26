import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, addBookToTBR, markBookAsReading, markBookAsRead, removeBookFromList, rateBook } from "@/lib/nostr";

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

  // Log warning if book data is incomplete
  useEffect(() => {
    if (!book.title || !book.author) {
      console.warn(`BookCard received incomplete book data: ISBN=${book.isbn}, hasTitle=${!!book.title}, hasAuthor=${!!book.author}`);
    }
  }, [book]);

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
    // Modified size classes to make cards smaller on large screens
    if (size === "small") sizeClasses = "max-w-[180px] w-full";
    else if (size === "large") sizeClasses = "max-w-[240px] w-full";
    else sizeClasses = "max-w-[210px] w-full"; // medium size - reduced from no max-width
    
    return `${baseClasses} ${layoutClasses} ${sizeClasses} ${className}`;
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

  const handleRating = async (rating: number) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to rate books",
        variant: "destructive"
      });
      return;
    }

    if (!book.isbn) {
      toast({
        title: "Invalid book data",
        description: "This book is missing an ISBN and cannot be rated",
        variant: "destructive"
      });
      return;
    }

    try {
      await rateBook(book.isbn, rating);
      
      toast({
        title: "Rating saved",
        description: `Your rating for ${book.title} has been saved`
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

  // Get display values with fallbacks for missing data
  const bookTitle = localBook.title || `Book (ISBN: ${localBook.isbn || "Unknown"})`;
  const authorDisplayName = localBook.author || "Unknown Author";

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0 flex flex-col h-full">
        {variant === "horizontal" ? (
          <div className="flex flex-row h-full">
            <div className={coverContainerClasses}>
              <BookCover 
                isbn={localBook.isbn}
                title={bookTitle}
                author={authorDisplayName}
                coverUrl={localBook.coverUrl}
                isRead={isRead}
                pendingAction={pendingAction}
                onReadAction={() => handleAction('finished')}
                onRemoveAction={mappedReadingStatus ? () => handleRemove(mappedReadingStatus) : undefined}
                readingStatus={mappedReadingStatus}
                size={size}
                rating={localBook.readingStatus?.rating}
                onRatingChange={handleRating}
              />
            </div>
            
            <div className={contentContainerClasses}>
              {showRating && (
                <BookRating 
                  rating={localBook.readingStatus?.rating} 
                  readingStatus={mappedReadingStatus}
                />
              )}
              
              {showCategories && size !== "small" && (
                <BookCategories categories={localBook.categories} />
              )}
              
              <BookActions
                book={localBook}
                onUpdate={handleBookUpdate}
                size={size}
                horizontal={true}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="relative" style={{ paddingTop: "150%" }}>
              <div className="absolute inset-0">
                <BookCover 
                  isbn={localBook.isbn}
                  title={bookTitle}
                  author={authorDisplayName}
                  coverUrl={localBook.coverUrl}
                  isRead={isRead}
                  pendingAction={pendingAction}
                  onReadAction={() => handleAction('finished')}
                  onRemoveAction={mappedReadingStatus ? () => handleRemove(mappedReadingStatus) : undefined}
                  readingStatus={mappedReadingStatus}
                  size={size}
                  rating={localBook.readingStatus?.rating}
                  onRatingChange={handleRating}
                />
              </div>
            </div>
            
            <div className={contentContainerClasses}>
              {showRating && (
                <BookRating 
                  rating={localBook.readingStatus?.rating} 
                  readingStatus={mappedReadingStatus}
                />
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
