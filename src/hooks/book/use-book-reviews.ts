
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

  // Use useCallback for the data fetching function to stabilize it
  const fetchReviewsData = useCallback(async () => {
    if (!isbn) return;
    
    try {
      // Fetch reviews - the fetchBookReviews function now handles de-duplication
      const bookReviews = await fetchBookReviews(isbn);
      
      // Fetch replies for each review
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
      
      // Fetch ratings - the fetchBookRatings function now handles de-duplication
      const bookRatings = await fetchBookRatings(isbn);
      setRatings(bookRatings);
      
      // Find the current user's rating (if logged in)
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
  }, [isbn, currentUser]);

  // Use useEffect with the callback
  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  // This function now only updates the local state without submitting to the network
  const handleRateBook = useCallback(async (book: Book | null, rating: number) => {
    if (!book || !isLoggedIn()) return;
    
    // Just update the local state
    setUserRating(rating);
  }, []);

  const handleSubmitReview = useCallback(async (book: Book | null) => {
    if (!book || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      console.log(`Submitting review with rating: ${userRating}`);
      
      // Check if review text is empty, and if so, find user's previous review to preserve content
      let finalReviewText = reviewText.trim();
      
      if (!finalReviewText && currentUser) {
        // Find current user's previous review to preserve its content
        const userPreviousReview = reviews.find(r => r.pubkey === currentUser.pubkey);
        
        if (userPreviousReview && userPreviousReview.content && userPreviousReview.content.trim()) {
          console.log("Found previous review content, preserving it:", userPreviousReview.content);
          finalReviewText = userPreviousReview.content;
        }
      }
      
      // Pass isSpoiler as the optional 4th parameter
      await reviewBook(book, finalReviewText, userRating > 0 ? userRating : undefined, isSpoiler);
      
      toast({
        title: "Review submitted",
        description: "Your review has been published"
      });
      setReviewText("");
      setIsSpoiler(false);
      
      // Refresh data after submission
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
