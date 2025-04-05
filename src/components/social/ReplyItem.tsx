import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Reply } from "@/lib/nostr/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { useReaction } from "@/hooks/use-reaction";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { extractMediaUrls, linkifyText } from "@/lib/utils/urlUtils";

interface ReplyItemProps {
  reply: Reply;
  onReaction?: (replyId: string) => void;
}

export function ReplyItem({ reply, onReaction }: ReplyItemProps) {
  const authorName = reply.author?.name || formatPubkey(reply.pubkey);
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
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

  const handleImageError = (url: string) => {
    console.log(`Error loading image in comment: ${url}`);
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  // Function to detect and render media in comment content
  const renderCommentMedia = () => {
    if (!reply.content) return null;
    
    const mediaUrls = extractMediaUrls(reply.content)
      .filter(url => !imageErrors[url]);
    
    if (mediaUrls.length === 0) return null;
    
    // Only handle images in comments for now
    const imageUrls = mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
    
    if (imageUrls.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2 pl-1">
        {imageUrls.map((url, index) => (
          <div 
            key={index} 
            className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 hover:opacity-90 transition-opacity"
          >
            {/* Use a smaller aspect ratio and max-width for comment images */}
            <AspectRatio ratio={16/9} className="max-w-xs sm:max-w-[200px] mx-auto">
              <img 
                src={url} 
                alt="Media from comment" 
                className="h-full w-full object-cover" 
                loading="lazy"
                onError={() => handleImageError(url)}
              />
            </AspectRatio>
          </div>
        ))}
      </div>
    );
  };

  const contentHasMedia = reply.content && extractMediaUrls(reply.content).length > 0;

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
          <div className="text-sm whitespace-pre-wrap break-words">
            {/* Use linkifyText to render clickable links, but hide media URLs if they will be rendered separately */}
            {linkifyText(reply.content, contentHasMedia)}
          </div>
          
          {/* Render images if present in comment */}
          {renderCommentMedia()}
          
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