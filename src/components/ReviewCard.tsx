
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BookReview } from "@/lib/nostr/types";
import { nip19 } from "nostr-tools";

interface ReviewCardProps {
  review: BookReview;
  bookTitle?: string;
  showBookInfo?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  bookTitle,
  showBookInfo = false
}) => {
  const formatPubkey = (key: string): string => {
    try {
      const npub = nip19.npubEncode(key);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${key.slice(0, 6)}...${key.slice(-4)}`;
    }
  };

  const displayRating = (): number | undefined => {
    if (review.rating === undefined) return undefined;
    
    // Always assume the rating is in 0-1 scale and convert to 1-5 scale
    return Math.round(review.rating * 5);
  };

  const starRating = displayRating();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        {showBookInfo && (
          <div className="flex gap-3 mb-2">
            {review.bookCover && (
              <Link to={`/book/${review.bookIsbn || ''}`} className="shrink-0">
                <img 
                  src={review.bookCover} 
                  alt={bookTitle || "Book cover"} 
                  className="h-16 w-12 object-cover rounded-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </Link>
            )}
            <div className="flex flex-col justify-center">
              {bookTitle && (
                <Link to={`/book/${review.bookIsbn || ''}`} className="text-lg font-medium hover:text-bookverse-accent transition-colors line-clamp-2">
                  {bookTitle}
                </Link>
              )}
              {review.bookAuthor && (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  by {review.bookAuthor}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {!showBookInfo && review.author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.author.picture} />
                <AvatarFallback>
                  {(review.author.name || formatPubkey(review.pubkey))[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link 
                to={`/profile/${review.author.npub}`}
                className="text-sm font-medium hover:text-bookverse-accent transition-colors"
              >
                {review.author.name || formatPubkey(review.pubkey)}
              </Link>
            </div>
          )}
          <div className="flex items-center gap-1">
            {starRating !== undefined && (
              <div className="flex mr-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < starRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            )}
            <Link 
              to={`/review/${review.id}`} 
              className="text-muted-foreground hover:text-bookverse-accent" 
              title="View full review"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-muted-foreground whitespace-pre-wrap">
          {review.content || "No review text provided."}
        </p>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        {review.createdAt && (
          <time dateTime={new Date(review.createdAt).toISOString()}>
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </time>
        )}
      </CardFooter>
    </Card>
  );
};
