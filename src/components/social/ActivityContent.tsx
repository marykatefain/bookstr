
import React from "react";
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
  const userName = activity.author?.name || formatPubkey(activity.pubkey);
  
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
          rating={activity.rating}
          content={activity.content}
        />
      );
    case 'post':
      if (!activity.book || !activity.book.isbn) {
        console.warn("Post activity missing book data:", activity);
      }
      return (
        <div className="space-y-2">
          <p>{activity.content}</p>
          {activity.mediaUrl && activity.mediaType === 'image' && (
            <img 
              src={activity.mediaUrl} 
              alt="Post media" 
              className="max-h-64 rounded-md mt-2 object-cover"
              onError={(e) => {
                console.log(`Error loading media: ${activity.mediaUrl}`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
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
