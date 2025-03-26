import React, { useState, useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reply } from "@/lib/nostr/types";
import { isLoggedIn, fetchReplies } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { getCurrentUser } from "@/lib/nostr/user";

interface RepliesSectionProps {
  eventId: string;
  authorPubkey: string;
  initialReplies?: Reply[];
  buttonLayout?: "vertical" | "horizontal";
  onReaction: (eventId: string) => void;
  reactionCount?: number;
  userReacted?: boolean;
  eventKind?: number; // Add this property
}

export function RepliesSection({
  eventId,
  authorPubkey,
  initialReplies = [],
  buttonLayout = "vertical",
  onReaction,
  reactionCount = 0,
  userReacted = false,
  eventKind // Add this property
}: RepliesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load replies if we expand and don't have initial replies
  useEffect(() => {
    if (expanded && initialReplies.length === 0) {
      loadReplies();
    }
  }, [expanded, initialReplies.length]);

  const loadReplies = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const fetchedReplies = await fetchReplies(eventId);
      setReplies(fetchedReplies);
    } catch (error) {
      console.error("Error loading replies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || submitting) return;
    
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to reply",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      await replyToContent(eventId, authorPubkey, replyText);
      
      toast({
        title: "Reply sent",
        description: "Your reply has been posted"
      });
      
      // Add optimistic reply
      if (currentUser) {
        const newReply: Reply = {
          id: `temp-${Date.now()}`,
          pubkey: currentUser.pubkey,
          content: replyText,
          createdAt: Date.now(),
          parentId: eventId,
          author: {
            name: currentUser.name || "You",
            picture: currentUser.picture,
            npub: currentUser.npub
          }
        };
        
        setReplies(prev => [newReply, ...prev]);
      }
      
      setReplyText("");
      setExpanded(true);
      
      // Refresh replies to get the real one
      setTimeout(() => {
        loadReplies();
      }, 2000);
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Could not send reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className={`flex ${buttonLayout === "vertical" ? "flex-col gap-2" : "gap-4"} items-center mb-2`}>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1 text-muted-foreground px-2 ${
            userReacted ? "text-red-500" : ""
          }`}
          onClick={() => onReaction(eventId)}
        >
          <Heart
            className={`h-4 w-4 ${userReacted ? "fill-red-500 text-red-500" : ""}`}
          />
          <span>{reactionCount > 0 ? reactionCount : ""}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground px-2"
          onClick={() => setExpanded(!expanded)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{replies.length > 0 ? replies.length : ""}</span>
        </Button>
      </div>

      {expanded && (
        <div className="border-t pt-3 mt-2">
          {isLoggedIn() && (
            <form onSubmit={handleSubmitReply} className="flex gap-2 mb-3">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-sm"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!replyText.trim() || submitting}
              >
                {submitting ? "Sending..." : "Reply"}
              </Button>
            </form>
          )}

          {loading ? (
            <div className="text-center py-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-xs text-muted-foreground mt-1">Loading replies...</p>
            </div>
          ) : replies.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Link to={`/user/${reply.pubkey}`} className="flex-shrink-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply.author?.picture} />
                      <AvatarFallback>{reply.author?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <Link to={`/user/${reply.pubkey}`} className="text-sm font-medium hover:underline">
                        {reply.author?.name || reply.pubkey.substring(0, 8)}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No replies yet</p>
          )}
        </div>
      )}
    </div>
  );
}
