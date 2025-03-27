import { useState, useEffect, useCallback } from "react";
import { Book, BookReview } from "@/lib/nostr/types";
import { 
  fetchBookReviews, 
  fetchBookRatings,
  reviewBook,
  rateBook, 
  isLoggedIn,
  getCurrentUser,
  fetchReplies
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

export const useBookReviews = (isbn: string | undefined) => {
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [ratings, setRatings] = useState<BookReview[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const fetchReviewsData = useCallback(async () => {
    if (!isbn) return;
    
    try {
      const bookReviews = await fetchBookReviews(isbn);
      
      const reviewsWithReplies = await Promise.all(
        bookReviews.map(async (review) => {
          try {
            const replies = await fetchReplies(review.id);
            return {
              ...review,
              replies
            };
          } catch (error) {
            console.error(`Error fetching replies for review ${review.id}:`, error);
            return review;
          }
        })
      );
      
      setReviews(reviewsWithReplies);
      
      const bookRatings = await fetchBookRatings(isbn);
      setRatings(bookRatings);
      
      if (currentUser && bookRatings.length > 0) {
        const userRatingObj = bookRatings.find(r => r.pubkey === currentUser.pubkey);
        if (userRatingObj && userRatingObj.rating !== undefined) {
          setUserRating(userRatingObj.rating);
        }
      }
    } catch (error) {
      console.error("Error fetching review data:", error);
    }
  }, [isbn, currentUser]);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  const handleRateBook = useCallback(async (book: Book | null, rating: number) => {
    if (!book || !isLoggedIn()) return;
    
    setUserRating(rating);
  }, []);

  const handleSubmitReview = useCallback(async (book: Book | null) => {
    if (!book || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      console.log(`Submitting review with rating: ${userRating}`);
      
      let finalReviewText = reviewText.trim();
      
      if (!finalReviewText && currentUser) {
        const userPreviousReview = reviews.find(r => r.pubkey === currentUser.pubkey);
        
        if (userPreviousReview && userPreviousReview.content && userPreviousReview.content.trim()) {
          console.log("Found previous review content, preserving it:", userPreviousReview.content);
          finalReviewText = userPreviousReview.content;
        }
      }
      
      await reviewBook(book, finalReviewText, userRating > 0 ? userRating : undefined, isSpoiler);
      
      toast({
        title: "Review submitted",
        description: "Your review has been published"
      });
      setReviewText("");
      setIsSpoiler(false);
      
      await fetchReviewsData();
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
  }, [isbn, reviewText, reviews, userRating, isSpoiler, toast, fetchReviewsData, currentUser]);

  return {
    reviews,
    ratings,
    userRating,
    reviewText,
    setReviewText,
    isSpoiler,
    setIsSpoiler,
    submitting,
    handleRateBook,
    handleSubmitReview
  };
};
