import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/components/ui/use-toast";
import { isLoggedIn, addBookToTBR, markBookAsReading, markBookAsRead } from "@/lib/nostr";

import { BookCover } from "./book/BookCover";
import { BookRating } from "./book/BookRating";
import { BookCategories } from "./book/BookCategories";
import { BookActionButtons } from "./book/BookActionButtons";

interface BookCardProps {
  book: Book;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  showRating?: boolean;
  showCategories?: boolean;
  onUpdate?: () => void;
  variant?: "horizontal" | "vertical";
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  size = "medium",
  showDescription = false,
  showRating = true,
  showCategories = true,
  onUpdate,
  variant = "vertical"
}) => {
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRead, setIsRead] = useState(book.readingStatus?.status === 'finished');

  const getCardClasses = () => {
    const baseClasses = "overflow-hidden h-full";
    
    const layoutClasses = variant === "horizontal" 
      ? "flex flex-row" 
      : "flex flex-col";
    
    if (size === "small") return `${baseClasses} ${layoutClasses} max-w-[220px] w-full`;
    if (size === "large") return `${baseClasses} ${layoutClasses} max-w-[280px] w-full`;
    return `${baseClasses} ${layoutClasses} w-full`; // medium size - no max width, full responsive width
  };

  const getTitleClasses = () => {
    const baseClasses = "font-bold font-serif truncate";
    if (size === "small") return `${baseClasses} text-xs`;
    if (size === "large") return `${baseClasses} text-lg`;
    return `${baseClasses} text-sm`; // medium size
  };

  const handleAction = async (action: 'want-to-read' | 'reading' | 'read') => {
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
      
      if (action === 'want-to-read') {
        result = await addBookToTBR(book);
      } else if (action === 'reading') {
        result = await markBookAsReading(book);
      } else if (action === 'read') {
        result = await markBookAsRead(book);
        setIsRead(true);
      }

      if (result) {
        let statusText = action === 'want-to-read' ? 'TBR' : action === 'reading' ? 'currently reading' : 'read';
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

  const coverContainerClasses = variant === "horizontal"
    ? "relative flex-shrink-0" + (size === "small" ? " w-16 h-16" : " w-24 h-24")
    : "relative" + (variant === "vertical" ? " style={{ paddingTop: '150%' }}" : "");

  const contentContainerClasses = variant === "horizontal"
    ? "p-2 space-y-1 flex-grow"
    : "p-3 space-y-1.5 flex-grow";

  const mappedReadingStatus = book.readingStatus?.status === 'tbr' 
    ? 'want-to-read' 
    : book.readingStatus?.status as 'want-to-read' | 'reading' | 'finished' | null;

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0 flex flex-col h-full">
        {variant === "horizontal" ? (
          <div className="flex flex-row h-full">
            <div className={coverContainerClasses}>
              <BookCover 
                isbn={book.isbn}
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                isRead={isRead}
                pendingAction={pendingAction}
                onReadAction={() => handleAction('read')}
                size={size}
              />
            </div>
            
            <div className={contentContainerClasses}>
              <h3 className={getTitleClasses()}>
                <Link 
                  to={`/book/${book.isbn}`}
                  className="hover:text-bookverse-accent transition-colors"
                >
                  {book.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
              
              {showRating && (
                <BookRating rating={book.readingStatus?.rating} />
              )}
              
              {showCategories && size !== "small" && (
                <BookCategories categories={book.categories} />
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="relative" style={{ paddingTop: "150%" }}>
              <div className="absolute inset-0">
                <BookCover 
                  isbn={book.isbn}
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl}
                  isRead={isRead}
                  pendingAction={pendingAction}
                  onReadAction={() => handleAction('read')}
                  size={size}
                />
              </div>
            </div>
            
            <div className={contentContainerClasses}>
              <h3 className={getTitleClasses()}>
                <Link 
                  to={`/book/${book.isbn}`}
                  className="hover:text-bookverse-accent transition-colors"
                >
                  {book.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
              
              {showRating && (
                <BookRating rating={book.readingStatus?.rating} />
              )}
              
              {showCategories && (
                <BookCategories categories={book.categories} />
              )}
              
              {showDescription && book.description && (
                <p className="text-xs line-clamp-2">{book.description}</p>
              )}
              
              <BookActionButtons 
                size={size}
                pendingAction={pendingAction}
                onAddToTbr={() => handleAction('want-to-read')}
                onStartReading={() => handleAction('reading')}
                readingStatus={mappedReadingStatus}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
