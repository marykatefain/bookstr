
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const { toast } = useToast();
  const isMobile = useIsMobile();

  return (
    <div className="pt-0 pb-4">
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={() => onReaction(activityId)}
        >
          <Heart className={`mr-1 h-4 w-4 ${userReacted ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{reactionCount ? reactionCount : 'Like'}</span>
        </Button>
        
        {!isMobile && (
          <Link to={`/book/${bookIsbn}`} className="ml-auto">
            <Button variant="ghost" size="sm">
              <Book className="mr-1 h-4 w-4" />
              <span>View Book</span>
            </Button>
          </Link>
        )}
      </div>
      
      <RepliesSection 
        eventId={activityId} 
        authorPubkey={authorPubkey}
        initialReplies={replies}
      />
    </div>
  );
}
