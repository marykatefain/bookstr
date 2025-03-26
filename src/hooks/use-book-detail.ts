
import { useBookData } from "./book/use-book-data";
import { useBookReviews } from "./book/use-book-reviews";
import { useBookActions } from "./book/use-book-actions";
import { useBookActivity } from "./book/use-book-activity";
import { useCallback } from "react";

export const useBookDetail = (isbn: string | undefined) => {
  const { 
    book, 
    loading, 
    isRead, 
    setIsRead,
    error,
    refetch 
  } = useBookData(isbn);

  const { 
    reviews, 
    ratings, 
    userRating, 
    reviewText, 
    setReviewText, 
    submitting, 
    handleRateBook, 
    handleSubmitReview 
  } = useBookReviews(isbn);

  const { 
    pendingAction, 
    handleMarkAsRead: markAsRead, 
    handleAddBookToList, 
    handleReactToContent 
  } = useBookActions();

  const { 
    activeTab, 
    setActiveTab, 
    bookActivity, 
    loadingActivity,
    refreshTrigger
  } = useBookActivity(isbn);

  // Combine the hooks with book-specific wrappers
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

  return {
    book,
    loading,
    error,
    refetch,
    reviews,
    ratings,
    userRating,
    reviewText,
    setReviewText,
    submitting,
    pendingAction,
    isRead,
    activeTab,
    setActiveTab,
    bookActivity,
    loadingActivity,
    refreshTrigger,
    handleMarkAsRead,
    handleRateBook: handleRateBookWrapper,
    handleSubmitReview: handleSubmitReviewWrapper,
    handleReactToReview,
    handleReactToActivity,
    handleAddBookToList
  };
};
