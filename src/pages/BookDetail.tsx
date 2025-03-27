
import React, { useEffect, useState, useRef } from "react";
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
import { OpenLibraryContributionDialog } from "@/components/book/OpenLibraryContributionDialog";

const BookDetail = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const { toast } = useToast();
  const [openContributionDialog, setOpenContributionDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const previousIsbnRef = useRef<string | undefined>(isbn);
  const dialogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogDismissedRef = useRef<boolean>(false);
  
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

  // Clean up timeout when component unmounts or when ISBN changes
  useEffect(() => {
    return () => {
      if (dialogTimeoutRef.current) {
        clearTimeout(dialogTimeoutRef.current);
      }
    };
  }, [isbn]);

  // Handle dialog open state changes
  const handleDialogOpenChange = (open: boolean) => {
    setOpenContributionDialog(open);
    
    // If the user is explicitly closing the dialog, mark it as dismissed
    if (open === false) {
      dialogDismissedRef.current = true;
    }
  };

  // Check for incomplete data only when the book data changes or when ISBN changes
  useEffect(() => {
    // Skip if we're still loading or don't have a book
    if (loading || !book) return;
    
    // If the ISBN changed, reset the state to avoid carrying over old data
    if (isbn !== previousIsbnRef.current) {
      setMissingFields([]);
      setOpenContributionDialog(false);
      dialogDismissedRef.current = false;
      previousIsbnRef.current = isbn;
      return;
    }
    
    // Skip further processing if we've already checked and opened the dialog
    // or if the user has dismissed the dialog for this book
    if (openContributionDialog || dialogDismissedRef.current) return;
    
    // Check for incomplete data
    const missing: string[] = [];
    
    // Only consider a field missing if it's completely empty or matches the placeholder values
    if (!book.title || book.title === 'Unknown Title') {
      missing.push('Title');
    }
    
    if (!book.author || book.author === 'Unknown Author') {
      missing.push('Author');
    }
    
    // Only consider cover missing if the field is empty (not just a placeholder image)
    if (!book.coverUrl || book.coverUrl === '') {
      missing.push('Cover Image');
    }
    
    // Only consider description missing if it's completely empty
    if (!book.description || book.description === '') {
      missing.push('Description');
    }
    
    // Only update state and show dialog if we actually have missing fields
    if (missing.length > 0) {
      setMissingFields(missing);
      
      // Small delay to ensure the user sees the page first
      dialogTimeoutRef.current = setTimeout(() => {
        setOpenContributionDialog(true);
        dialogTimeoutRef.current = null;
      }, 1500);
    }
  }, [book, loading, isbn, openContributionDialog]);

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
      
      {/* Open Library Contribution Dialog */}
      <OpenLibraryContributionDialog
        open={openContributionDialog}
        onOpenChange={handleDialogOpenChange}
        book={book}
        missingFields={missingFields}
      />
    </Layout>
  );
};

export default BookDetail;
