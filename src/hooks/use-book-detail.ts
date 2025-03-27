
import { useBookData } from "./book/use-book-data";
import { useBookReviews } from "./book/use-book-reviews";
import { useBookActions } from "./book/use-book-actions";
import { useBookActivity } from "./book/use-book-activity";
import { useCallback } from "react";

/**
 * Hook that aggregates all book-related data and actions for a book detail page
 * @param isbn The ISBN of the book to fetch data for
 */
export const useBookDetail = (isbn: string | undefined) => {
  // Book data and reading status
  const { 
    book, 
    loading, 
    isRead, 
    setIsRead,
    error,
    refetch 
  } = useBookData(isbn);

  // Reviews and ratings
  const { 
    reviews, 
    ratings, 
    userRating, 
    reviewText, 
    setReviewText, 
    submitting, 
    handleRateBook, 
    handleSubmitReview,
    isSpoiler,
    setIsSpoiler
  } = useBookReviews(isbn);

  // Book actions (mark as read, add to list, etc.)
  const { 
    pendingAction, 
    handleMarkAsRead: markAsRead, 
    handleAddBookToList, 
    handleReactToContent,
    handleRemoveBookFromList: removeBookFromList
  } = useBookActions();

  // Activity feed and tab management
  const { 
    activeTab, 
    setActiveTab, 
    bookActivity, 
    loadingActivity,
    refreshTrigger
  } = useBookActivity(isbn);

  // Book-specific action wrappers
  const handleMarkAsRead = useCallback(() => {
    if (!book) return;
    return markAsRead(book, setIsRead);
  }, [markAsRead, book, setIsRead]);
  
  const handleRateBookWrapper = useCallback((rating: number) => {
    if (!book) return;
    return handleRateBook(book, rating);
  }, [handleRateBook, book]);
  
  const handleSubmitReviewWrapper = useCallback(() => {
    if (!book) return;
    return handleSubmitReview(book);
  }, [handleSubmitReview, book]);
  
  const handleReactToReview = useCallback((reviewId: string) => {
    return handleReactToContent(reviewId);
  }, [handleReactToContent]);
  
  const handleReactToActivity = useCallback((activityId: string) => {
    return handleReactToContent(activityId);
  }, [handleReactToContent]);

  // Add a wrapper for removing a book from a list
  const handleRemoveBookFromList = useCallback((book: any, listType: 'tbr' | 'reading' | 'finished') => {
    return removeBookFromList(book, listType);
  }, [removeBookFromList]);

  return {
    // Book data
    book,
    loading,
    error,
    refetch,
    
    // Reviews and ratings
    reviews,
    ratings,
    userRating,
    reviewText,
    setReviewText,
    submitting,
    isSpoiler,
    setIsSpoiler,
    
    // Action states
    pendingAction,
    isRead,
    
    // Activity and tabs
    activeTab,
    setActiveTab,
    bookActivity,
    loadingActivity,
    refreshTrigger,
    
    // Action handlers
    handleMarkAsRead,
    handleRateBook: handleRateBookWrapper,
    handleSubmitReview: handleSubmitReviewWrapper,
    handleReactToReview,
    handleReactToActivity,
    handleAddBookToList,
    handleRemoveBookFromList
  };
};
