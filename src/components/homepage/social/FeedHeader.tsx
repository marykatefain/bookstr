import React, { ReactNode } from "react";
import { Users } from "lucide-react";

interface FeedHeaderProps {
  children?: ReactNode;
  showFeedTypeSelector?: boolean;
}

export function FeedHeader({
  children,
  showFeedTypeSelector = true
}: FeedHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
        <Users className="mr-2 h-5 w-5" />
        #Bookstr Community on Nostr
      </h2>
      
      {showFeedTypeSelector && children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}