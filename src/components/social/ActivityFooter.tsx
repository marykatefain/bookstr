
import React from "react";
import { RepliesSection } from "./RepliesSection";
import { Reply } from "@/lib/nostr/types";
import { useReaction } from "@/hooks/use-reaction";

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
  // Use our new reaction hook with the contentId
  const { 
    reactionState,
    toggleReaction
  } = useReaction(
    activityId,
    reactionCount !== undefined ? { count: reactionCount, userReacted: userReacted || false } : undefined
  );

  const handleReaction = async () => {
    console.log(`ActivityFooter: Handling reaction for activity ${activityId}`);
    
    // Call our centralized reaction handler
    await toggleReaction();
    
    // Call the parent's onReaction callback
    onReaction(activityId);
  };

  return (
    <div className="pt-0 pb-4">
      <RepliesSection 
        eventId={activityId} 
        authorPubkey={authorPubkey}
        initialReplies={replies}
        buttonLayout="horizontal"
        onReaction={handleReaction}
        reactionCount={reactionState.count}
        userReacted={reactionState.userReacted}
      />
    </div>
  );
}
