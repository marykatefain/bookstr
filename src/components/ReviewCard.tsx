
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        {showBookInfo && bookTitle && (
          <Link to={`/book/${review.bookIsbn || ''}`} className="text-lg font-medium hover:text-bookverse-accent transition-colors">
            {bookTitle}
          </Link>
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
          {starRating !== undefined && (
            <div className="flex items-center gap-1">
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
        </div>
      </CardHeader>
      <CardContent className="pb-2">
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
