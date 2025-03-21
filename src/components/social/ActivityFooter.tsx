
import React, { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
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
    setLoading(true);
    try {
      const result = await fetchReactions(activityId);
      setReactions(result);
    } catch (error) {
      console.error("Error fetching activity reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (eventId: string) => {
    onReaction(eventId);
    // Update local state optimistically
    setReactions(prev => ({
      count: prev.userReacted ? prev.count - 1 : prev.count + 1,
      userReacted: !prev.userReacted
    }));
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
