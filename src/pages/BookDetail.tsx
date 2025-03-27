
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
import { useToast } from "@/hooks/use-toast";

const BookDetail = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const { toast } = useToast();
  
  // Use the hook with the ISBN from params
  const {
    book,
    loading,
    error,
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
    handleAddBookToList,
    handleRemoveBookFromList
  } = useBookDetail(isbn);

  // Show error toast when we have an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading book details",
        description: "Please try again later or search for another book",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Log debug data about the book
  useEffect(() => {
    if (book) {
      console.log(`Book detail loaded: ${book.title} by ${book.author} (${book.isbn})`);
      
      // Check for incomplete data
      if (!book.title || !book.author) {
        console.warn(`Incomplete book data: ISBN=${book.isbn}, hasTitle=${!!book.title}, hasAuthor=${!!book.author}`);
        toast({
          title: "Limited book information",
          description: "We could only find partial details for this book",
          variant: "warning"
        });
      }
    } else if (!loading && isbn) {
      console.warn(`No book data found for ISBN: ${isbn}`);
    }
  }, [book, loading, isbn, toast]);

  // Handle removing book from the finished/read list
  const handleRemoveFromReadList = () => {
    if (book) {
      handleRemoveBookFromList(book, 'finished');
    }
  };

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

  // Use fallback title/author if missing
  const displayTitle = book.title || `Book (ISBN: ${book.isbn || "Unknown"})`;
  const displayAuthor = book.author || "Unknown Author";

  return (
    <Layout>
      <div className="container px-4 py-8">
        <BookDetailHeader
          book={{
            ...book,
            title: displayTitle,
            author: displayAuthor
          }}
          avgRating={avgRating}
          ratingsCount={ratings.length}
          isRead={isRead}
          pendingAction={pendingAction}
          handleMarkAsRead={handleMarkAsRead}
          addBookToList={handleAddBookToList}
          handleRemove={isRead ? handleRemoveFromReadList : undefined}
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
