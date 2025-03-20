
import React, { useState } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { formatPubkey } from "@/lib/utils/format";
import { BookListActivity } from "./activities/BookListActivity";
import { BookRatingActivity } from "./activities/BookRatingActivity";
import { BookReviewActivity } from "./activities/BookReviewActivity";
import { PostCard } from "../post/PostCard";

interface ActivityContentProps {
  activity: SocialActivity;
}

export function ActivityContent({ activity }: ActivityContentProps) {
  const [imageError, setImageError] = useState(false);
  const userName = activity.author?.name || formatPubkey(activity.pubkey);
  
  // Handle image loading errors
  const handleImageError = () => {
    console.log(`Error loading media in activity: ${activity.id}`);
    setImageError(true);
  };
  
  switch (activity.type) {
    case 'tbr':
    case 'reading':
    case 'finished':
      return (
        <BookListActivity
          userName={userName}
          userPubkey={activity.pubkey}
          bookTitle={activity.book.title}
          bookIsbn={activity.book.isbn}
          type={activity.type}
        />
      );
    case 'rating':
      return (
        <BookRatingActivity
          userName={userName}
          userPubkey={activity.pubkey}
          bookTitle={activity.book.title}
          bookIsbn={activity.book.isbn}
          rating={activity.rating}
        />
      );
    case 'review':
      return (
        <BookReviewActivity
          userName={userName}
          userPubkey={activity.pubkey}
          bookTitle={activity.book.title}
          bookIsbn={activity.book.isbn}
          bookCover={activity.book.coverUrl}
          rating={activity.rating}
          content={activity.content}
        />
      );
    case 'post':
      return (
        <div className="space-y-2">
          <p>{activity.content}</p>
          {activity.mediaUrl && activity.mediaType === 'image' && !imageError && (
            <img 
              src={activity.mediaUrl} 
              alt="Post media" 
              className="max-h-64 rounded-md mt-2 object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          )}
        </div>
      );
    default:
      console.warn(`Unknown activity type: ${activity.type}`);
      return (
        <div className="text-sm text-muted-foreground">
          Activity type not supported
        </div>
      );
  }
}
