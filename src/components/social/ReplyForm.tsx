
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, replyToContent } from "@/lib/nostr";

interface ReplyFormProps {
  eventId: string;
  authorPubkey: string;
  onReplySubmitted: () => void;
  onCancel?: () => void;
}

export function ReplyForm({ 
  eventId, 
  authorPubkey, 
  onReplySubmitted,
  onCancel 
}: ReplyFormProps) {
  const [replyText, setReplyText] = useState("#bookstr ");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !isLoggedIn()) return;
    
    setIsSubmitting(true);
    try {
      await replyToContent(eventId, authorPubkey, replyText);
      
      toast({
        title: "Reply sent",
        description: "Your reply has been posted"
      });
      
      setReplyText("#bookstr ");
      onReplySubmitted();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-2 w-full">
      <Textarea
        placeholder="Write your reply..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        className="min-h-[80px] text-sm w-full"
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          size="sm"
          disabled={!replyText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Reply
        </Button>
      </div>
    </form>
  );
}
