
import React from "react";
import { Reply } from "@/lib/nostr/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface RepliesListProps {
  replies: Reply[];
}

export function RepliesList({ replies }: RepliesListProps) {
  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-4">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-2 items-start">
          <Avatar className="h-7 w-7">
            <AvatarImage src={reply.author?.picture} alt="User avatar" />
            <AvatarFallback>
              {reply.author?.name?.[0] || formatPubkey(reply.pubkey)[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted/40 dark:bg-muted/20 rounded-md p-3 text-sm">
            <div className="flex justify-between items-center mb-1">
              <Link to={`/user/${reply.pubkey}`} className="font-medium hover:underline">
                {reply.author?.name || formatPubkey(reply.pubkey)}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="whitespace-pre-wrap break-words">{reply.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
