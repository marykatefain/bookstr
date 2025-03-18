
import React from "react";
import { Book } from "@/lib/nostr/types";
import { BookOpen, Star, Calendar, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookRating } from "@/components/book/BookRating";

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
          <Button 
            className="flex-1"
            variant="outline"
            onClick={() => addBookToList(book, 'tbr')}
            disabled={pendingAction !== null}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            To Be Read
          </Button>
          
          <Button 
            className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
            onClick={() => addBookToList(book, 'reading')}
            disabled={pendingAction !== null}
          >
            <Star className="mr-2 h-4 w-4" />
            Start Reading
          </Button>
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
      <BookReadButton 
        isRead={isRead}
        pendingAction={pendingAction}
        handleMarkAsRead={handleMarkAsRead}
      />
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
  return (
    <div className="md:w-2/3">
      <h1 className="text-3xl font-bold text-bookverse-ink">{book.title}</h1>
      <h2 className="text-xl text-muted-foreground mt-2">{book.author}</h2>
      
      <div className="flex flex-wrap gap-4 mt-4">
        {avgRating > 0 && (
          <div className="flex items-center gap-1">
            <BookRating rating={Math.round(avgRating)} />
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
