import React, { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, reactToContent } from "@/lib/nostr";
import { Reply } from "@/lib/nostr/types";
import { RepliesList } from "./RepliesList";
import { CreateReply } from "./CreateReply";

interface RepliesSectionProps {
  eventId: string;
  authorPubkey: string;
  initialReplies?: Reply[];
  buttonLayout?: "vertical" | "horizontal";
  reactionCount?: number;
  userReacted?: boolean;
  onReaction?: (eventId: string) => void;
}

export function RepliesSection({ 
  eventId, 
  authorPubkey,
  initialReplies = [],
  buttonLayout = "vertical",
  reactionCount = 0,
  userReacted = false,
  onReaction
}: RepliesSectionProps) {
  const [showReplies, setShowReplies] = useState(false);
  const { toast } = useToast();
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };
  
  const handleReaction = async () => {
    if (onReaction) {
      onReaction(eventId);
    } else {
      if (!isLoggedIn()) {
        toast({
          title: "Login required",
          description: "Please sign in to react to this content",
          variant: "destructive"
        });
        return;
      }
      
      try {
        await reactToContent(eventId);
        toast({
          title: "Reaction sent",
          description: "You've reacted to this content"
        });
        // We don't update the UI here as that's handled by the parent
      } catch (error) {
        console.error("Error sending reaction:", error);
        toast({
          title: "Error",
          description: "Could not send reaction",
          variant: "destructive"
        });
      }
    }
  };
  
  const addReply = (newReply: Reply) => {
    setReplies(prevReplies => [...prevReplies, newReply]);
  };
  
  return (
    <div className="w-full">
      <div className={`flex ${buttonLayout === "vertical" ? "flex-col space-y-2" : "space-x-2"} items-start`}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReaction}
          className="text-muted-foreground h-8"
        >
          <Heart 
            className={`h-4 w-4 mr-1 ${userReacted ? "fill-red-500 text-red-500" : ""}`} 
          />
          <span>{reactionCount > 0 ? reactionCount : ""} Like{reactionCount !== 1 ? "s" : ""}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleReplies}
          className="text-muted-foreground h-8"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          <span>{initialReplies.length > 0 ? initialReplies.length : ""} {showReplies ? "Hide" : "Reply"}</span>
        </Button>
      </div>
      
      {showReplies && (
        <div className="mt-4">
          <RepliesList replies={replies} />
          <CreateReply eventId={eventId} authorPubkey={authorPubkey} onReplyCreated={addReply} />
        </div>
      )}
    </div>
  );
}
