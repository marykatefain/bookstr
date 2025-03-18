
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
      return (
        <PostCard post={activity} />
      );
    default:
      return null;
  }
}
