
import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPubkey } from "@/lib/utils/format";

interface ActivityAuthorProps {
  pubkey: string;
  name?: string;
  picture?: string;
  createdAt: number;
}

export function ActivityAuthor({ pubkey, name, picture, createdAt }: ActivityAuthorProps) {
  return (
    <div className="flex items-center gap-3">
      <Link to={`/user/${pubkey}`}>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
          <AvatarImage src={picture} />
          <AvatarFallback>{name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex flex-col">
        <Link 
          to={`/user/${pubkey}`} 
          className="font-medium text-sm hover:underline"
        >
          {name || formatPubkey(pubkey)}
        </Link>
        <time className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </time>
      </div>
    </div>
  );
}
