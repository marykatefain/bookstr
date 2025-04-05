import React from "react";
import { Link } from "react-router-dom";
import { Reply } from "@/lib/nostr/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { useReaction } from "@/hooks/use-reaction";

interface ReplyItemProps {
  reply: Reply;
  onReaction?: (replyId: string) => void;
}

export function ReplyItem({ reply, onReaction }: ReplyItemProps) {
  const authorName = reply.author?.name || formatPubkey(reply.pubkey);
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });
  
  // Use the reaction hook to manage reaction state
  const { 
    reactionState, 
    isLoading, 
    toggleReaction 
  } = useReaction(reply.id, {
    count: reply.reactions?.count || 0,
    userReacted: reply.reactions?.userReacted || false
  });

  const handleReaction = async () => {
    if (isLoading) return;
    
    // Toggle the reaction in the context
    await toggleReaction();
    
    // Call the parent's onReaction callback if provided
    if (onReaction) {
      onReaction(reply.id);
    }
  };

  return (
    <div className="pl-6 border-l border-muted py-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={reply.author?.picture} />
          <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <Link 
              to={`/user/${reply.pubkey}`} 
              className="text-sm font-medium hover:underline"
            >
              {authorName}
            </Link>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">
            {reply.content}
          </p>
          
          {/* Reaction button */}
          <div className="mt-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleReaction}
              disabled={isLoading}
            >
              <Heart 
                className={`h-3 w-3 mr-1 ${reactionState.userReacted ? 'fill-red-500 text-red-500' : ''}`} 
              />
              {reactionState.count > 0 ? reactionState.count : 'Like'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}