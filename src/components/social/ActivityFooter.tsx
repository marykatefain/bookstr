
import React, { useEffect } from "react";
import { RepliesSection } from "./RepliesSection";
import { Reply } from "@/lib/nostr/types";
import { fetchReactions } from "@/lib/nostr";
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
  // Use our new reaction hook
  const { 
    reactionState,
    updateReactionState,
    toggleReaction
  } = useReaction({
    count: reactionCount || 0,
    userReacted: userReacted || false
  });

  // Update the reaction state when props change
  useEffect(() => {
    if (reactionCount !== undefined) {
      updateReactionState({
        count: reactionCount,
        userReacted: userReacted || false
      });
    } else {
      fetchActivityReactions();
    }
  }, [activityId, reactionCount, userReacted]);

  const fetchActivityReactions = async () => {
    console.log(`ActivityFooter: Fetching reactions for activity ${activityId}`);
    try {
      const result = await fetchReactions(activityId);
      console.log(`ActivityFooter: Fetched reactions for ${activityId}:`, result);
      updateReactionState(result);
    } catch (error) {
      console.error("Error fetching activity reactions:", error);
    }
  };

  const handleReaction = async (eventId: string) => {
    console.log(`ActivityFooter: Handling reaction for event ${eventId}`);
    
    // Call our centralized reaction handler
    await toggleReaction(eventId);
    
    // Call the parent's onReaction callback
    onReaction(eventId);
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
