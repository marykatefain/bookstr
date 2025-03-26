
import React from "react";
import { RepliesSection } from "./RepliesSection";
import { Reply } from "@/lib/nostr/types";

interface ActivityFooterProps {
  bookIsbn: string;
  activityId: string;
  authorPubkey: string;
  reactionCount?: number;
  userReacted?: boolean;
  onReaction: (activityId: string) => void;
  replies?: Reply[];
}

export function ActivityFooter({ 
  bookIsbn, 
  activityId,
  authorPubkey,
  reactionCount, 
  userReacted, 
  onReaction,
  replies = []
}: ActivityFooterProps) {
  return (
    <div className="pt-0 pb-4">
      <RepliesSection 
        eventId={activityId} 
        authorPubkey={authorPubkey}
        initialReplies={replies}
        buttonLayout="horizontal"
        onReaction={onReaction}
        reactionCount={reactionCount}
        userReacted={userReacted}
      />
    </div>
  );
}
