import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Star, Calendar, Clock, MessageCircle, Heart, Check, Loader2, FileText, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookActions } from "@/components/BookActions";
import { PostCard } from "@/components/post/PostCard";
import { ActivityCard } from "@/components/social/ActivityCard";
import { FeedLoadingState } from "@/components/social/FeedLoadingState";
import { 
  fetchBookByISBN, 
  fetchBookReviews, 
  fetchBookRatings,
  reviewBook,
  rateBook,
  reactToContent,
  replyToContent,
  isLoggedIn,
  getCurrentUser,
  addBookToList
} from "@/lib/nostr";
import { Book, BookReview, BookActionType, Post, SocialActivity } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { fetchBookActivity } from "@/lib/nostr/fetch/socialFetch";

const BookDetail = () => {
  const { isbn } = useParams<{ isbn: string }>();
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

  const formatPubkey = (pubkey: string): string => {
    try {
      const npub = nip19.npubEncode(pubkey);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;
    }
  };

  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < count ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  const renderRatingControls = () => {
    return (
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Your Rating:</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRateBook(rating)}
              disabled={submitting}
              className={`rounded-full p-1 ${userRating === rating ? 'bg-yellow-100' : ''}`}
            >
              <Star className={`h-6 w-6 ${userRating >= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderReviewForm = () => {
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
  };

  const renderReviews = () => {
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
                        {renderStars(review.rating)}
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
        <CardFooter className="pt-0 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={() => handleReactToReview(review.id)}
          >
            <Heart className="mr-1 h-4 w-4" />
            <span>Like</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            <span>Reply</span>
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  const renderCommunityActivity = () => {
    if (loadingActivity) {
      return <FeedLoadingState />;
    }
    
    if (bookActivity.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No community activity for this book yet. Be the first to post or review!
        </p>
      );
    }
    
    return (
      <div className="space-y-4">
        {bookActivity.map(activity => (
          <ActivityCard 
            key={activity.id} 
            activity={activity} 
            onReaction={handleReactToActivity} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="md:w-2/3 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="container px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Book Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            We couldn't find the book you're looking for.
          </p>
          <Link to="/books">
            <Button className="mt-4">Browse Books</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
    : 0;

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="sticky top-20">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }} 
                />
                <button
                  onClick={handleMarkAsRead}
                  className={`absolute top-2 right-2 rounded-full p-1.5 transition-all duration-200 
                    ${isRead 
                      ? "bg-green-500 text-white" 
                      : "bg-white/30 backdrop-blur-sm border border-white/50 text-white hover:bg-green-500 hover:border-green-500"}`}
                  title="Mark as read"
                >
                  {pendingAction === 'finished' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  className="flex-1"
                  variant="outline"
                  onClick={() => book && addBookToList(book, 'tbr')}
                  disabled={pendingAction !== null}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  To Be Read
                </Button>
                
                <Button 
                  className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
                  onClick={() => book && addBookToList(book, 'reading')}
                  disabled={pendingAction !== null}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Start Reading
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold text-bookverse-ink">{book.title}</h1>
            <h2 className="text-xl text-muted-foreground mt-2">{book.author}</h2>
            
            <div className="flex flex-wrap gap-4 mt-4">
              {avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {renderStars(Math.round(avgRating))}
                  </div>
                  <span className="ml-1 text-sm">({ratings.length})</span>
                </div>
              )}
              
              {book.pageCount && book.pageCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              
              {book.pubDate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Published {book.pubDate}</span>
                </div>
              )}
              
              {book.isbn && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>ISBN: {book.isbn}</span>
                </div>
              )}
            </div>
            
            {book.categories && book.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.categories.map((category, index) => (
                  <span 
                    key={index} 
                    className="bg-bookverse-paper text-bookverse-ink px-2 py-1 rounded-full text-xs"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            {book.description && (
              <div className="mt-6">
                <h3 className="text-lg font-medium">Description</h3>
                <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}
            
            <Separator className="my-8" />
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Community</h3>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => setActiveTab(value as "reviews" | "activity")}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="reviews" className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Activity</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {activeTab === "reviews" && (
                <>
                  {renderReviewForm()}
                  <div className="mt-8 space-y-4">
                    {renderReviews()}
                  </div>
                </>
              )}
              
              {activeTab === "activity" && (
                <div className="mt-4">
                  {renderCommunityActivity()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookDetail;
