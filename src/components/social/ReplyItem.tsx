
import React from "react";
import { Link } from "react-router-dom";
import { Reply } from "@/lib/nostr/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";

interface ReplyItemProps {
  reply: Reply;
}

export function ReplyItem({ reply }: ReplyItemProps) {
  const authorName = reply.author?.name || formatPubkey(reply.pubkey);
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });

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
        </div>
      </div>
    </div>
  );
}
