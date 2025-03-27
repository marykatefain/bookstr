
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { fetchEventById, reactToContent, fetchUserProfile } from "@/lib/nostr";
import { NOSTR_KINDS, BookReview } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchReplies } from "@/lib/nostr";
import { RepliesSection } from "@/components/social/RepliesSection";
import { getBookByISBN } from "@/lib/openlibrary";
import { Skeleton } from "@/components/ui/skeleton";
import { convertRawRatingToDisplayRating } from "@/lib/utils/ratings";

const ReviewDetail = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [review, setReview] = useState<BookReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadReview = async () => {
      if (!reviewId) {
        setError("No review ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const event = await fetchEventById(reviewId);
        
        if (!event) {
          setError("Review not found");
          setLoading(false);
          return;
        }
        
        let isbn = null;
        for (const tag of event.tags) {
          if ((tag[0] === 'd' || tag[0] === 'i') && tag[1]?.startsWith('isbn:')) {
            isbn = tag[1].replace('isbn:', '');
            break;
          }
        }
        
        if (!isbn) {
          setError("No book information found for this review");
          setLoading(false);
          return;
        }
        
        let rating = null;
        const ratingTag = event.tags.find(tag => tag[0] === 'rating');
        if (ratingTag && ratingTag[1]) {
          try {
            rating = parseFloat(ratingTag[1]);
            console.log("Raw rating from API:", rating);
            rating = convertRawRatingToDisplayRating(rating);
            console.log("Setting Display rating to: ", rating);
          } catch (e) {
            console.error("Error parsing rating:", e);
          }
        }
        
        // Check for spoiler/content-warning tag
        const contentWarningTag = event.tags.find(tag => tag[0] === 'content-warning');
        const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
        const isSpoiler = !!contentWarningTag || (!!spoilerTag && spoilerTag[1] === "true");
        
        const replies = await fetchReplies(event.id);
        
        const bookDetails = await getBookByISBN(isbn);
        
        const authorProfile = await fetchUserProfile(event.pubkey);
        
        const reviewData: BookReview = {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          rating,
          createdAt: event.created_at * 1000,
          bookIsbn: isbn,
          bookTitle: bookDetails?.title || "Unknown Book",
          bookAuthor: bookDetails?.author || "Unknown Author",
          bookCover: bookDetails?.coverUrl,
          author: authorProfile ? {
            name: authorProfile.name || authorProfile.display_name || "Unknown User",
            picture: authorProfile.picture,
            npub: event.pubkey
          } : undefined,
          replies,
          isSpoiler
        };
        
        setReview(reviewData);
      } catch (error) {
        console.error("Error loading review:", error);
        setError("Failed to load review");
      } finally {
        setLoading(false);
      }
    };
    
    loadReview();
  }, [reviewId]);

  const handleReaction = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      await reactToContent(eventId);
      toast({
        title: "Reaction sent",
        description: "Your reaction has been published"
      });
    } catch (error) {
      console.error("Error sending reaction:", error);
      toast({
        title: "Error",
        description: "Failed to send reaction",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-32" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Skeleton className="h-32 w-24" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mb-1" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !review) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-xl font-semibold mb-2">
                {error || "Review not found"}
              </h1>
              <p className="text-muted-foreground mb-6">
                The review you're looking for doesn't seem to exist or couldn't be loaded.
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const rating = review.rating;

  return (
    <Layout>
      <div className="container px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.author?.picture} />
                  <AvatarFallback>
                    {review.author?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link 
                    to={`/user/${review.pubkey}`} 
                    className="font-medium hover:underline"
                  >
                    {review.author?.name || "Unknown User"}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {review.createdAt && (
                      <time dateTime={new Date(review.createdAt).toISOString()}>
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </time>
                    )}
                  </div>
                </div>
              </div>
              
              {rating !== undefined && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < rating
                          ? "text-bookverse-highlight fill-bookverse-highlight"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6">
              {review.bookCover && (
                <Link to={`/book/${review.bookIsbn}`} className="shrink-0">
                  <img 
                    src={review.bookCover} 
                    alt={review.bookTitle || "Book cover"} 
                    className="w-24 md:w-32 object-cover rounded-md mx-auto md:mx-0"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </Link>
              )}
              
              <div className="flex-1">
                <Link to={`/book/${review.bookIsbn}`} className="text-xl font-semibold hover:text-bookverse-accent transition-colors block mb-1">
                  {review.bookTitle}
                </Link>
                {review.bookAuthor && (
                  <p className="text-muted-foreground mb-4">by {review.bookAuthor}</p>
                )}
                
                <div className="mt-4 prose prose-slate dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{review.content}</p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 flex-col items-start">
            <RepliesSection 
              eventId={review.id}
              authorPubkey={review.pubkey}
              initialReplies={review.replies}
              onReaction={() => handleReaction(review.id)}
              eventKind={NOSTR_KINDS.REVIEW}
            />
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ReviewDetail;
