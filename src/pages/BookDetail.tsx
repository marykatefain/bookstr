
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { useBookDetail } from "@/hooks/use-book-detail";
import { BookDetailHeader } from "@/components/book/BookDetailHeader";
import { BookCommunityTabs } from "@/components/book/BookCommunityTabs";
import { BookReviewSection } from "@/components/book/BookReviewSection";
import { BookActivitySection } from "@/components/book/BookActivitySection";
import { BookDetailSkeleton } from "@/components/book/BookDetailSkeleton";
import { BookNotFound } from "@/components/book/BookNotFound";

const BookDetail = () => {
  const { isbn } = useParams<{ isbn: string }>();
  
  // Use the hook with the ISBN from params
  const {
    book,
    loading,
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
    handleRateBook,
    handleSubmitReview,
    handleReactToReview,
    handleReactToActivity,
    handleAddBookToList
  } = useBookDetail(isbn);

  // Calculate average rating 
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
    : 0;

  if (loading) {
    return (
      <Layout>
        <BookDetailSkeleton />
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <BookNotFound />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8">
        <BookDetailHeader
          book={book}
          avgRating={avgRating}
          ratingsCount={ratings.length}
          isRead={isRead}
          pendingAction={pendingAction}
          handleMarkAsRead={handleMarkAsRead}
          addBookToList={handleAddBookToList}
        />
        
        <Separator className="my-8" />
        
        <div className="space-y-6">
          <BookCommunityTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reviewsCount={reviews.length}
          />
          
          {activeTab === "reviews" && (
            <BookReviewSection
              reviews={reviews}
              userRating={userRating}
              reviewText={reviewText}
              setReviewText={setReviewText}
              submitting={submitting}
              handleSubmitReview={handleSubmitReview}
              handleRateBook={handleRateBook}
              handleReactToReview={handleReactToReview}
            />
          )}
          
          {activeTab === "activity" && (
            <div className="mt-4">
              <BookActivitySection
                bookActivity={bookActivity}
                loadingActivity={loadingActivity}
                handleReactToActivity={handleReactToActivity}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookDetail;
