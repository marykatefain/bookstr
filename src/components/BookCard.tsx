
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, BookOpen, PlusCircle, Loader2, Check } from "lucide-react";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/components/ui/use-toast";
import { isLoggedIn, addBookToTBR, markBookAsReading, markBookAsRead } from "@/lib/nostr";

interface BookCardProps {
  book: Book;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  showRating?: boolean;
  showCategories?: boolean;
  onUpdate?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  size = "medium",
  showDescription = false,
  showRating = true,
  showCategories = true,
  onUpdate
}) => {
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Determine styles based on size
  const getCardClasses = () => {
    const baseClasses = "overflow-hidden h-full book-card";
    if (size === "small") return `${baseClasses} max-w-[200px]`;
    if (size === "large") return `${baseClasses} max-w-[300px]`;
    return baseClasses; // medium size
  };

  const getTitleClasses = () => {
    const baseClasses = "font-bold font-serif truncate";
    if (size === "small") return `${baseClasses} text-sm`;
    if (size === "large") return `${baseClasses} text-xl`;
    return baseClasses; // medium size
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

    setPendingAction(action);

    try {
      let result: string | null;
      
      if (action === 'want-to-read') {
        result = await addBookToTBR(book);
      } else if (action === 'reading') {
        result = await markBookAsReading(book);
      } else if (action === 'read') {
        result = await markBookAsRead(book);
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

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-0">
        <div className="relative aspect-[2/3] book-cover">
          <img
            src={book.coverUrl}
            alt={`${book.title} by ${book.author}`}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.currentTarget.src = "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
            }}
          />
          {/* Check mark button for marking as read */}
          <button
            onClick={() => handleAction('read')}
            className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-full p-1 transition-colors"
            title="Mark as read"
          >
            {pendingAction === 'read' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="p-4 space-y-2">
          <h3 className={getTitleClasses()}>{book.title}</h3>
          <p className="text-sm text-muted-foreground">by {book.author}</p>
          
          {showRating && (
            <div className="flex items-center space-x-1">
              {book.readingStatus?.rating ? (
                [...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < (book.readingStatus?.rating || 0) 
                        ? "text-bookverse-highlight fill-bookverse-highlight" 
                        : "text-muted-foreground"
                    }`}
                  />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No ratings yet</span>
              )}
            </div>
          )}
          
          {showCategories && book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {book.categories.slice(0, 2).map((category, index) => (
                <Badge key={`${category}-${index}`} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}
          
          {showDescription && book.description && (
            <p className="text-sm line-clamp-2">{book.description}</p>
          )}
          
          <div className="pt-2 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleAction('want-to-read')}
              disabled={!!pendingAction}
            >
              {pendingAction === 'want-to-read' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-1 h-4 w-4" />
              )}
              {size === 'small' ? 'TBR' : 'To Be Read'}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
              onClick={() => handleAction('reading')}
              disabled={!!pendingAction}
            >
              {pendingAction === 'reading' ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="mr-1 h-4 w-4" />
              )}
              {size === 'small' ? 'Start' : 'Start Reading'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
