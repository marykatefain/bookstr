
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, replyToContent, getCurrentUser } from "@/lib/nostr";
import { Reply } from "@/lib/nostr/types";

interface CreateReplyProps {
  eventId: string;
  authorPubkey: string;
  onReplyCreated: (reply: Reply) => void;
}

export function CreateReply({ eventId, authorPubkey, onReplyCreated }: CreateReplyProps) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !isLoggedIn()) {
      if (!isLoggedIn()) {
        toast({
          title: "Login required",
          description: "Please sign in to reply to this content",
          variant: "destructive"
        });
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      const replyId = await replyToContent(eventId, authorPubkey, replyText);
      
      if (replyId) {
        toast({
          title: "Reply sent",
          description: "Your reply has been posted"
        });
        
        // Create a new reply object to add to the UI
        const currentUser = getCurrentUser();
        const newReply: Reply = {
          id: replyId,
          pubkey: currentUser?.pubkey || "",
          content: replyText,
          createdAt: Date.now(),
          parentId: eventId,
          author: {
            name: currentUser?.name || "",
            picture: currentUser?.picture || "",
            npub: currentUser?.npub || ""
          }
        };
        
        onReplyCreated(newReply);
        setReplyText("");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Could not send your reply",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn()) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <Textarea
        placeholder="Write a reply..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        className="min-h-[80px] text-sm"
        disabled={isSubmitting}
      />
      <div className="flex justify-end mt-2">
        <Button 
          type="submit" 
          size="sm"
          disabled={!replyText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending
            </>
          ) : (
            "Reply"
          )}
        </Button>
      </div>
    </form>
  );
}
