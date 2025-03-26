
import React, { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply } from "@/lib/nostr/types";
import { isLoggedIn, replyToContent } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { formatPubkey } from "@/lib/utils/format";

interface RepliesSectionProps {
  eventId: string;
  authorPubkey: string;
  initialReplies?: Reply[];
  buttonLayout?: "vertical" | "horizontal";
  onReaction: (eventId: string) => void;
  reactionCount?: number;
  userReacted?: boolean;
  eventKind?: number;
}

export function RepliesSection({
  eventId,
  authorPubkey,
  initialReplies = [],
  buttonLayout = "vertical",
  onReaction,
  reactionCount = 0,
  userReacted = false,
  eventKind = 1
}: RepliesSectionProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const { toast } = useToast();

  const handleShowReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      const success = await replyToContent(eventId, authorPubkey, replyText, eventKind);
      
      if (success) {
        // Create a placeholder reply for immediate display
        const currentUser = isLoggedIn() ? window.nostr._activeAccount : null;
        if (currentUser) {
          const newReply: Reply = {
            id: `temp-${Date.now()}`,
            content: replyText,
            pubkey: currentUser.pubkey,
            createdAt: Date.now(),
            author: {
              name: currentUser.name || formatPubkey(currentUser.pubkey),
              picture: currentUser.picture,
              npub: currentUser.npub
            }
          };
          
          setReplies([newReply, ...replies]);
        }
        
        setReplyText("");
        toast({
          title: "Reply sent",
          description: "Your reply has been published"
        });
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className={`flex ${buttonLayout === "vertical" ? "flex-col space-y-2" : "space-x-4"} items-start mt-2`}>
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground flex items-center ${userReacted ? 'text-red-500' : ''}`}
          onClick={() => onReaction(eventId)}
        >
          <Heart className={`mr-1 h-4 w-4 ${userReacted ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{reactionCount > 0 ? reactionCount : ''}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground flex items-center"
          onClick={handleShowReplies}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          <span>{replies.length > 0 ? replies.length : ''}</span>
        </Button>
      </div>
      
      {showReplies && (
        <div className="mt-4 space-y-4">
          {isLoggedIn() ? (
            <div className="flex items-start space-x-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] flex-1"
                disabled={submitting}
              />
              <Button 
                size="sm" 
                onClick={handleSubmitReply} 
                disabled={!replyText.trim() || submitting}
                className="mt-1"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to leave a reply</p>
          )}
          
          {replies.length > 0 ? (
            <div className="space-y-3 mt-3">
              {replies.map(reply => (
                <div key={reply.id} className="flex space-x-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.author?.picture} />
                    <AvatarFallback>{reply.author?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{reply.author?.name || formatPubkey(reply.pubkey)}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No replies yet</p>
          )}
        </div>
      )}
    </div>
  );
}
