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
    handleRemoveBookFromList,
    isSpoiler,
    setIsSpoiler
  } = useBookDetail(isbn);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading book details",
        description: "Please try again later or search for another book",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  useEffect(() => {
    return () => {
      if (dialogTimeoutRef.current) {
        clearTimeout(dialogTimeoutRef.current);
      }
    };
  }, [isbn]);

  const handleDialogOpenChange = (open: boolean) => {
    setOpenContributionDialog(open);
    
    if (open === false) {
      dialogDismissedRef.current = true;
    }
  };

  useEffect(() => {
    if (loading || !book) return;
    
    if (isbn !== previousIsbnRef.current) {
      setMissingFields([]);
      setOpenContributionDialog(false);
      dialogDismissedRef.current = false;
      previousIsbnRef.current = isbn;
      return;
    }
    
    if (openContributionDialog || dialogDismissedRef.current) return;
    
    const missing: string[] = [];
    
    if (!book.title || book.title === 'Unknown Title') {
      missing.push('Title');
    }
    
    if (!book.author || book.author === 'Unknown Author') {
      missing.push('Author');
    }
    
    if (!book.coverUrl || book.coverUrl === '') {
      missing.push('Cover Image');
    }
    
    if (!book.description || book.description === '') {
      missing.push('Description');
    }
    
    if (missing.length > 0) {
      setMissingFields(missing);
      
      dialogTimeoutRef.current = setTimeout(() => {
        setOpenContributionDialog(true);
        dialogTimeoutRef.current = null;
      }, 1500);
    }
  }, [book, loading, isbn, openContributionDialog]);

  const handleRateBookWrapper = (rating: number) => {
    if (book) {
      handleRateBook(book, rating);
    }
  };

  const handleRemoveFromReadList = () => {
    if (book) {
      handleRemoveBookFromList(book, 'finished');
    }
  };

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
          handleRateBook={handleRateBookWrapper}
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
              handleRateBook={handleRateBookWrapper}
              handleReactToReview={handleReactToActivity}
              isSpoiler={isSpoiler}
              setIsSpoiler={setIsSpoiler}
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
