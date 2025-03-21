
import { useState, useEffect } from "react";
import { Book, BookReview } from "@/lib/nostr/types";
import { 
  fetchBookReviews, 
  fetchBookRatings,
  reviewBook,
  isLoggedIn,
  getCurrentUser,
  fetchReplies
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

export const useBookReviews = (isbn: string | undefined) => {
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [ratings, setRatings] = useState<BookReview[]>([]);
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
      } catch (error) {
        console.error("Error fetching review data:", error);
      }
    };
    
    fetchReviewsData();
  }, [isbn, currentUser]);

  const handleSubmitReview = async (book: Book | null) => {
    if (!book || !reviewText.trim() || !isLoggedIn()) return;
    
    setSubmitting(true);
    try {
      await reviewBook(book, reviewText);
      toast({
        title: "Review submitted",
        description: "Your review has been published"
      });
      setReviewText("");
      
      const updatedReviews = await fetchBookReviews(isbn || "");
      
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
    reviewText,
    setReviewText,
    submitting,
    handleSubmitReview
  };
};
