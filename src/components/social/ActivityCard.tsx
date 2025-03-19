
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SocialActivity } from "@/lib/nostr/types";
import { ActivityAuthor } from "./ActivityAuthor";
import { BookCoverPreview } from "./BookCoverPreview";
import { ActivityContent } from "./ActivityContent";
import { ActivityFooter } from "./ActivityFooter";

interface ActivityCardProps {
  activity: SocialActivity;
  onReaction: (activityId: string) => void;
}

export function ActivityCard({ activity, onReaction }: ActivityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <ActivityAuthor
          pubkey={activity.pubkey}
          name={activity.author?.name}
          picture={activity.author?.picture}
          createdAt={activity.createdAt}
        />
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex gap-4">
          <BookCoverPreview
            isbn={activity.book.isbn}
            title={activity.book.title}
            coverUrl={activity.book.coverUrl}
          />
          <div className="flex-1">
            <ActivityContent activity={activity} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <ActivityFooter
          bookIsbn={activity.book.isbn}
          activityId={activity.id}
          authorPubkey={activity.pubkey}
          reactionCount={activity.reactions?.count}
          userReacted={activity.reactions?.userReacted}
          onReaction={onReaction}
          replies={activity.replies}
        />
      </CardFooter>
    </Card>
  );
}
