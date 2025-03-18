
import { useState, useEffect } from "react";
import { 
  Book, 
  BookReview, 
  SocialActivity, 
  BookActionType 
} from "@/lib/nostr/types";
import {
  fetchBookByISBN,
  fetchBookReviews,
  fetchBookRatings,
  reviewBook,
  rateBook,
  reactToContent,
  addBookToList,
  getCurrentUser,
  isLoggedIn
} from "@/lib/nostr";
import { fetchBookActivity } from "@/lib/nostr/fetch/socialFetch";
import { useToast } from "@/hooks/use-toast";

export const useBookDetail = (isbn: string | undefined) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [ratings, setRatings] = useState<BookReview[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<BookActionType | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");
  const [bookActivity, setBookActivity] = useState<SocialActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      if (!isbn) return;
      
      setLoading(true);
      try {
        const bookData = await fetchBookByISBN(isbn);
        if (bookData) {
          setBook(bookData);
          setIsRead(bookData.readingStatus?.status === 'finished');
        }
        
        const bookReviews = await fetchBookReviews(isbn);
        setReviews(bookReviews);
        
        const bookRatings = await fetchBookRatings(isbn);
        setRatings(bookRatings);
        
        if (currentUser && bookRatings.length > 0) {
          const userRating = bookRatings.find(r => r.pubkey === currentUser.pubkey);
          if (userRating && userRating.rating) {
            setUserRating(userRating.rating);
          }
        }
        
        setLoadingActivity(true);
        try {
          // Update to pass the proper format for fetching activities related to this ISBN
          const activity = await fetchBookActivity(isbn);
          setBookActivity(activity);
        } catch (activityError) {
          console.error("Error fetching community activity:", activityError);
        } finally {
          setLoadingActivity(false);
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
        toast({
          title: "Error",
          description: "Could not load book details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isbn, toast, currentUser]);

  const handleMarkAsRead = async () => {
    if (!book || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to mark books as read",
        variant: "destructive"
      });
      return;
    }

    setPendingAction('finished');
    try {
      await addBookToList(book, 'finished');
      setIsRead(true);
      toast({
        title: "Success!",
        description: "Book marked as read",
      });
    } catch (error) {
      console.error("Error marking book as read:", error);
      toast({
        title: "Error",
        description: "Could not mark book as read",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRateBook = async (rating: number) => {
    if (!book || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      await rateBook(book, rating);
      setUserRating(rating);
      toast({
        title: "Rating submitted",
        description: `You rated "${book.title}" ${rating} stars`
      });
      
      const updatedRatings = await fetchBookRatings(isbn || "");
      setRatings(updatedRatings);
    } catch (error) {
      console.error("Error rating book:", error);
      toast({
        title: "Error",
        description: "Could not submit rating",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!book || !reviewText.trim() || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      await reviewBook(book, reviewText, userRating > 0 ? userRating : undefined);
      toast({
        title: "Review submitted",
        description: "Your review has been published"
      });
      setReviewText("");
      
      const updatedReviews = await fetchBookReviews(isbn || "");
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Could not submit review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactToReview = async (reviewId: string) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to reviews",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await reactToContent(reviewId);
      toast({
        title: "Reaction sent",
        description: "You've reacted to this review"
      });
    } catch (error) {
      console.error("Error reacting to review:", error);
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
    }
  };

  const handleReactToActivity = async (activityId: string) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await reactToContent(activityId);
      toast({
        title: "Reaction sent",
        description: "You've reacted to this content"
      });
      
      setBookActivity(prev => 
        prev.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              reactions: {
                count: (activity.reactions?.count || 0) + 1,
                userReacted: true
              }
            };
          }
          return activity;
        })
      );
    } catch (error) {
      console.error("Error reacting to content:", error);
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
    }
  };

  const handleAddBookToList = async (book: Book, listType: 'tbr' | 'reading') => {
    if (!book) return;
    
    setPendingAction(listType);
    try {
      await addBookToList(book, listType);
      toast({
        title: "Success!",
        description: `Book added to your ${listType === 'tbr' ? 'to be read' : 'currently reading'} list.`,
      });
    } catch (error) {
      console.error(`Error adding book to ${listType} list:`, error);
      toast({
        title: "Error",
        description: "Could not add book to list",
        variant: "destructive"
      });
    } finally {
      setPendingAction(null);
    }
  };

  return {
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
    handleMarkAsRead,
    handleRateBook,
    handleSubmitReview,
    handleReactToReview,
    handleReactToActivity,
    handleAddBookToList
  };
};
