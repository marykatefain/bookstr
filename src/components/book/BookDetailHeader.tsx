import React, { useState } from "react";
import { Book } from "@/lib/nostr/types";
import { BookOpen, Star, Calendar, Clock, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookRating } from "@/components/book/BookRating";
import { rateBook } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

interface BookDetailHeaderProps {
  book: Book;
  avgRating: number;
  ratingsCount: number;
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
  addBookToList: (book: Book, listType: 'tbr' | 'reading') => void;
}

export const BookDetailHeader: React.FC<BookDetailHeaderProps> = ({
  book,
  avgRating,
  ratingsCount,
  isRead,
  pendingAction,
  handleMarkAsRead,
  addBookToList
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <BookCoverSection
        book={book}
        isRead={isRead}
        pendingAction={pendingAction}
        handleMarkAsRead={handleMarkAsRead}
        addBookToList={addBookToList}
      />
      
      <BookInfoSection
        book={book}
        avgRating={avgRating}
        ratingsCount={ratingsCount}
      />
    </div>
  );
};

const BookCoverSection: React.FC<{
  book: Book;
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
  addBookToList: (book: Book, listType: 'tbr' | 'reading') => void;
}> = ({ book, isRead, pendingAction, handleMarkAsRead, addBookToList }) => {
  const readingStatus = book.readingStatus?.status;
  const isTbr = readingStatus === 'tbr';
  const isReading = readingStatus === 'reading';
  const isFinished = readingStatus === 'finished';
  const [isRating, setIsRating] = useState(false);
  const { toast } = useToast();
  
  const showActionButtons = !isFinished;
  const showUnmarkButton = isFinished;
  
  return (
    <div className="md:w-1/3">
      <div className="sticky top-20">
        <BookCover
          book={book}
          isRead={isRead}
          pendingAction={pendingAction}
          handleMarkAsRead={handleMarkAsRead}
        />
        <div className="mt-4 flex gap-2">
          {showActionButtons && (
            <>
              <Button 
                className={`flex-1 ${isTbr ? "bg-bookverse-highlight" : ""}`}
                variant={isTbr ? "default" : "outline"}
                onClick={() => addBookToList(book, 'tbr')}
                disabled={pendingAction !== null}
              >
                {isTbr ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <BookOpen className="mr-2 h-4 w-4" />
                )}
                {isTbr ? "On TBR List" : "To Be Read"}
              </Button>
              
              <Button 
                className={`flex-1 ${isReading ? "bg-bookverse-highlight" : "bg-bookverse-accent hover:bg-bookverse-highlight"}`}
                onClick={() => addBookToList(book, 'reading')}
                disabled={pendingAction !== null}
              >
                {isReading ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Star className="mr-2 h-4 w-4" />
                )}
                {isReading ? "Currently Reading" : "Start Reading"}
              </Button>
            </>
          )}
          
          {showUnmarkButton && (
            <Button 
              className="flex-1 bg-bookverse-highlight"
              onClick={handleMarkAsRead}
              disabled={pendingAction !== null}
            >
              <X className="mr-2 h-4 w-4" />
              Unmark as Read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const BookCover: React.FC<{
  book: Book;
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
}> = ({ book, isRead, pendingAction, handleMarkAsRead }) => {
  const isFinished = book.readingStatus?.status === 'finished';
  const [isRating, setIsRating] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const { toast } = useToast();
  const rating = book.readingStatus?.rating;
  
  const handleRateBook = async (newRating: number) => {
    if (!book.isbn) {
      toast({
        title: "Cannot rate book",
        description: "This book is missing an ISBN",
        variant: "destructive"
      });
      return;
    }
    
    setIsRating(true);
    
    try {
      await rateBook(book.isbn, newRating);
      toast({
        title: "Rating saved",
        description: "Your rating has been saved and published to Nostr"
      });
    } catch (error) {
      console.error("Error rating book:", error);
      toast({
        title: "Rating failed",
        description: "There was an error saving your rating",
        variant: "destructive"
      });
    } finally {
      setIsRating(false);
    }
  };

  const renderRatingStars = () => {
    const starCount = 5;
    const displayRating = rating ? Math.round(rating * 5) : 0;
    const hoverRating = ratingHover !== null ? ratingHover : displayRating;
    
    return (
      <div 
        className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-full flex items-center"
        onMouseLeave={() => setRatingHover(null)}
      >
        {[...Array(starCount)].map((_, i) => (
          <button
            key={i}
            className="p-0.5"
            onClick={() => handleRateBook((i + 1) / 5)}
            onMouseEnter={() => setRatingHover(i + 1)}
            disabled={isRating}
            aria-label={`Rate ${i + 1} stars`}
          >
            <Star
              size={16}
              className={`
                ${i < hoverRating ? 'text-bookverse-highlight fill-bookverse-highlight' : 'text-white'}
                transition-colors
              `}
            />
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md">
      <img 
        src={book.coverUrl} 
        alt={book.title} 
        className="object-cover w-full h-full"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }} 
      />
      
      {!isFinished && (
        <BookReadButton 
          isRead={isRead}
          pendingAction={pendingAction}
          handleMarkAsRead={handleMarkAsRead}
        />
      )}
      
      {isFinished && renderRatingStars()}
    </div>
  );
};

const BookReadButton: React.FC<{
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
}> = ({ isRead, pendingAction, handleMarkAsRead }) => {
  return (
    <button
      onClick={handleMarkAsRead}
      className={`absolute top-2 right-2 rounded-full p-1.5 transition-all duration-200 
        ${isRead 
          ? "bg-green-500 text-white" 
          : "bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-green-500 hover:border-green-500"}`}
      title="Mark as read"
    >
      {pendingAction === 'finished' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </button>
  );
};

const BookInfoSection: React.FC<{
  book: Book;
  avgRating: number;
  ratingsCount: number;
}> = ({ book, avgRating, ratingsCount }) => {
  const readingStatus = book.readingStatus?.status;
  let mappedReadingStatus: 'tbr' | 'reading' | 'finished' | null = null;
  
  if (readingStatus === 'tbr') {
    mappedReadingStatus = 'tbr';
  } else if (readingStatus === 'reading') {
    mappedReadingStatus = 'reading';
  } else if (readingStatus === 'finished') {
    mappedReadingStatus = 'finished';
  }

  return (
    <div className="md:w-2/3">
      <h1 className="text-3xl font-bold text-bookverse-ink">{book.title}</h1>
      <h2 className="text-xl text-muted-foreground mt-2">{book.author}</h2>
      
      <div className="flex flex-wrap gap-4 mt-4">
        {avgRating > 0 && (
          <div className="flex items-center gap-1">
            <BookRating 
              rating={avgRating} 
              readingStatus={mappedReadingStatus}
            />
            <span className="ml-1 text-sm">({ratingsCount})</span>
          </div>
        )}
        
        {book.pageCount && book.pageCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{book.pageCount} pages</span>
          </div>
        )}
        
        {book.pubDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Published {book.pubDate}</span>
          </div>
        )}
        
        {book.isbn && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>ISBN: {book.isbn}</span>
          </div>
        )}
      </div>
      
      {book.categories && book.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {book.categories.map((category, index) => (
            <span 
              key={index} 
              className="bg-bookverse-paper text-bookverse-ink px-2 py-1 rounded-full text-xs"
            >
              {category}
            </span>
          ))}
        </div>
      )}
      
      {book.description && (
        <div className="mt-6">
          <h3 className="text-lg font-medium">Description</h3>
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
            {book.description}
          </p>
        </div>
      )}
    </div>
  );
};
