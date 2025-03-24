
import { useState, useEffect } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchReviewsData = async () => {
      if (!isbn) return;
      
      try {
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

  // This function now only updates the local state without submitting to the network
  const handleRateBook = async (book: Book | null, rating: number) => {
    if (!book || !isLoggedIn()) return;
    
    // Just update the local state
    setUserRating(rating);
  };

  const handleSubmitReview = async (book: Book | null) => {
    if (!book || !reviewText.trim() || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      // Submit both the review text and rating together
      await reviewBook(book, reviewText, userRating > 0 ? userRating : undefined);
      toast({
        title: "Review submitted",
        description: "Your review has been published"
      });
      setReviewText("");
      
      // Update both reviews and ratings after submission
      const updatedReviews = await fetchBookReviews(isbn || "");
      const updatedRatings = await fetchBookRatings(isbn || "");
      
      // Fetch replies for the updated reviews
      const reviewsWithReplies = await Promise.all(
        updatedReviews.map(async (review) => {
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
      setRatings(updatedRatings);
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
