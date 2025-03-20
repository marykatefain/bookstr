import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { BookReview } from "@/lib/nostr/types";
import { formatPubkey } from "@/lib/utils/format";
import { isLoggedIn } from "@/lib/nostr";
import { RepliesSection } from "@/components/social/RepliesSection";
import { NOSTR_KINDS } from "@/lib/nostr/types";

interface BookReviewSectionProps {
  reviews: BookReview[];
  userRating: number;
  reviewText: string;
  setReviewText: (text: string) => void;
  submitting: boolean;
  handleSubmitReview: () => void;
  handleRateBook: (rating: number) => void;
  handleReactToReview: (reviewId: string) => void;
}

export const BookReviewSection: React.FC<BookReviewSectionProps> = ({
  reviews,
  userRating,
  reviewText,
  setReviewText,
  submitting,
  handleSubmitReview,
  handleRateBook,
  handleReactToReview
}) => {
  const displayRating = userRating > 0 ? Math.round(userRating * 5) : 0;
  
  return (
    <div className="space-y-6">
      {renderReviewForm()}
      <div className="mt-8 space-y-4">
        {renderReviews()}
      </div>
    </div>
  );

  function renderStars(count: number) {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < count ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  }

  function renderRatingControls() {
    return (
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Your Rating:</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRateBook(rating / 5)}
              disabled={submitting}
              className={`rounded-full p-1 ${displayRating === rating ? 'bg-yellow-100' : ''}`}
            >
              <Star className={`h-6 w-6 ${displayRating >= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderReviewForm() {
    if (!isLoggedIn()) {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to leave a review or rating
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>Share your thoughts about this book</CardDescription>
        </CardHeader>
        <CardContent>
          {renderRatingControls()}
          <Textarea
            className="mt-4"
            placeholder="Write your review here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
          />
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmitReview} 
            disabled={!reviewText.trim() || submitting}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  function renderReviews() {
    if (reviews.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet. Be the first to review this book!
        </p>
      );
    }
    
    return reviews.map((review) => (
      <Card key={review.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.author?.picture} />
                <AvatarFallback>{review.author?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  to={`/user/${review.pubkey}`} 
                  className="font-medium hover:underline"
                >
                  {review.author?.name || formatPubkey(review.pubkey)}
                </Link>
                <div className="flex items-center text-muted-foreground text-xs">
                  <time>{new Date(review.createdAt).toLocaleDateString()}</time>
                  {review.rating && (
                    <>
                      <span className="mx-1">•</span>
                      <div className="flex items-center">
                        {renderStars(Math.round(review.rating * 5))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-sm whitespace-pre-wrap">{review.content}</p>
        </CardContent>
        <CardFooter className="pt-0 flex-col items-start">
          <RepliesSection 
            eventId={review.id}
            authorPubkey={review.pubkey}
            initialReplies={review.replies}
            buttonLayout="horizontal"
            onReaction={handleReactToReview}
            eventKind={NOSTR_KINDS.REVIEW}
          />
        </CardFooter>
      </Card>
    ));
  }
};
