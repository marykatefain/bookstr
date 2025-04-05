
import React from "react";
import { Book } from "@/lib/nostr/types";
import { BookCoverSection } from "./detail-header/CoverSection";
import { BookInfoSection } from "./detail-header/BookInfoSection";
import { Rating } from "@/lib/utils/Rating";

interface BookDetailHeaderProps {
  book: Book;
  avgRating: Rating;
  ratingsCount: number;
  isRead: boolean;
  pendingAction: string | null;
  handleMarkAsRead: () => void;
  addBookToList: (book: Book, listType: 'tbr' | 'reading') => void;
  handleRemove?: () => void;
}

export const BookDetailHeader: React.FC<BookDetailHeaderProps> = ({
  book,
  avgRating,
  ratingsCount,
  isRead,
  pendingAction,
  handleMarkAsRead,
  addBookToList,
  handleRemove
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <BookCoverSection
        book={book}
        isRead={isRead}
        pendingAction={pendingAction}
        handleMarkAsRead={handleMarkAsRead}
        addBookToList={addBookToList}
        handleRemove={handleRemove}
      />
      
      <BookInfoSection
        book={book}
        avgRating={avgRating}
        ratingsCount={ratingsCount}
      />
    </div>
  );
};
