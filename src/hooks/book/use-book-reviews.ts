
import { useState, useEffect } from "react";
import { Book, BookReview } from "@/lib/nostr/types";
import { 
  fetchBookReviews, 
  fetchBookRatings,
  reviewBook,
  rateBook, 
  isLoggedIn,
  getCurrentUser
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

export const useBookReviews = (isbn: string | undefined) => {
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [ratings, setRatings] = useState<BookReview[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchReviewsData = async () => {
      if (!isbn) return;
      
      try {
        const bookReviews = await fetchBookReviews(isbn);
        setReviews(bookReviews);
        
        const bookRatings = await fetchBookRatings(isbn);
        setRatings(bookRatings);
        
        if (currentUser && bookRatings.length > 0) {
          const userRatingObj = bookRatings.find(r => r.pubkey === currentUser.pubkey);
          if (userRatingObj && userRatingObj.rating !== undefined) {
            // Store in original 0-1 scale for consistency
            setUserRating(userRatingObj.rating);
          }
        }
      } catch (error) {
        console.error("Error fetching review data:", error);
      }
    };
    
    fetchReviewsData();
  }, [isbn, currentUser]);

  const handleRateBook = async (book: Book | null, rating: number) => {
    if (!book || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      // Rating is expected to be in 0-1 scale when passed from BookReviewSection
      await rateBook(book, rating);
      setUserRating(rating);
      
      // For display purposes, convert from 0-1 scale to 1-5 scale
      const displayRating = Math.round(rating * 5);
      toast({
        title: "Rating submitted",
        description: `You rated "${book.title}" ${displayRating} stars`
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

  const handleSubmitReview = async (book: Book | null) => {
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

  return {
    reviews,
    ratings,
    userRating,
    reviewText,
    setReviewText,
    submitting,
    handleRateBook,
    handleSubmitReview
  };
};
