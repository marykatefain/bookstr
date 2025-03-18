
import React from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityFooterProps {
  bookIsbn: string;
  activityId: string;
  reactionCount?: number;
  userReacted?: boolean;
  onReaction: (activityId: string) => void;
}

export function ActivityFooter({ 
  bookIsbn, 
  activityId, 
  reactionCount, 
  userReacted, 
  onReaction 
}: ActivityFooterProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleReplyClick = () => {
    toast({
      title: "Coming soon",
      description: "Reply functionality will be available soon"
    });
  };

  return (
    <div className="pt-0 pb-4 flex gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={() => onReaction(activityId)}
      >
        <Heart className={`mr-1 h-4 w-4 ${userReacted ? 'fill-red-500 text-red-500' : ''}`} />
        <span>{reactionCount ? reactionCount : 'Like'}</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={handleReplyClick}
      >
        <MessageCircle className="mr-1 h-4 w-4" />
        <span>Reply</span>
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
  );
}
