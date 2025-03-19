
import React, { useState, useEffect } from "react";
import { Reply } from "@/lib/nostr/types";
import { ReplyItem } from "./ReplyItem";
import { ReplyForm } from "./ReplyForm";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown, ChevronUp, Loader2, Heart } from "lucide-react";
import { fetchReplies, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

interface RepliesSectionProps {
  eventId: string;
  authorPubkey: string;
  initialReplies?: Reply[];
  buttonLayout?: "horizontal" | "vertical";
  onReaction?: (eventId: string) => void;
  reactionCount?: number;
  userReacted?: boolean;
}

export function RepliesSection({ 
  eventId, 
  authorPubkey, 
  initialReplies = [],
  buttonLayout = "vertical",
  onReaction,
  reactionCount,
  userReacted
}: RepliesSectionProps) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(initialReplies.length > 0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const { toast } = useToast();

  const fetchReplyData = async () => {
    if (!eventId) return;
    
    setLoadingReplies(true);
    try {
      const fetchedReplies = await fetchReplies(eventId);
      setReplies(fetchedReplies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast({
        title: "Error",
        description: "Could not load replies",
        variant: "destructive"
      });
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (showReplies && replies.length === 0) {
      fetchReplyData();
    }
  }, [showReplies, eventId]);

  const handleReplyClick = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to reply",
        variant: "destructive"
      });
      return;
    }
    setShowReplyForm(true);
    // If replies are not already shown, fetch and show them
    if (!showReplies) {
      setShowReplies(true);
    }
  };

  const handleReplySubmitted = () => {
    setShowReplyForm(false);
    fetchReplyData();
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleReaction = () => {
    if (onReaction) {
      onReaction(eventId);
    }
  };

  return (
    <div className="mt-2">
      <div className={`flex items-center ${buttonLayout === "horizontal" ? "gap-4" : "flex-col items-start gap-2"}`}>
        {onReaction && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={handleReaction}
          >
            <Heart className={`mr-1 h-4 w-4 ${userReacted ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{reactionCount ? reactionCount : 'Like'}</span>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={handleReplyClick}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          <span>Reply</span>
        </Button>
        
        {(replies.length > 0 || loadingReplies) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={toggleReplies}
          >
            {loadingReplies ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <>
                {showReplies ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
              </>
            )}
            <span>{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</span>
          </Button>
        )}
      </div>

      {showReplyForm && (
        <ReplyForm 
          eventId={eventId} 
          authorPubkey={authorPubkey} 
          onReplySubmitted={handleReplySubmitted}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {showReplies && (
        <div className="mt-3 space-y-1">
          {loadingReplies && replies.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            replies.map(reply => (
              <ReplyItem key={reply.id} reply={reply} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
