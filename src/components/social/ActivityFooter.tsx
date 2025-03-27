
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { RepliesSection } from "./RepliesSection";
import { Reply } from "@/lib/nostr/types";
import { fetchReactions } from "@/lib/nostr";

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
  const isMobile = useIsMobile();
  const [reactions, setReactions] = useState({
    count: reactionCount || 0,
    userReacted: userReacted || false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reactionCount !== undefined) {
      setReactions({
        count: reactionCount,
        userReacted: userReacted || false
      });
    } else {
      fetchActivityReactions();
    }
  }, [activityId, reactionCount, userReacted]);

  const fetchActivityReactions = async () => {
    console.log(`ActivityFooter: Fetching reactions for activity ${activityId}`);
    setLoading(true);
    try {
      const result = await fetchReactions(activityId);
      console.log(`ActivityFooter: Fetched reactions for ${activityId}:`, result);
      setReactions(result);
    } catch (error) {
      console.error("Error fetching activity reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (eventId: string) => {
    console.log(`ActivityFooter: Handling reaction for event ${eventId}`);
    onReaction(eventId);
    // Update local state optimistically
    setReactions(prev => {
      const newState = {
        count: prev.userReacted ? prev.count - 1 : prev.count + 1,
        userReacted: !prev.userReacted
      };
      console.log(`ActivityFooter: Updated local reaction state for ${eventId}:`, newState);
      return newState;
    });
  };

  return (
    <div className="pt-0 pb-4">
      <RepliesSection 
        eventId={activityId} 
        authorPubkey={authorPubkey}
        initialReplies={replies}
        buttonLayout="horizontal"
        onReaction={handleReaction}
        reactionCount={reactions.count}
        userReacted={reactions.userReacted}
      />
    </div>
  );
}
