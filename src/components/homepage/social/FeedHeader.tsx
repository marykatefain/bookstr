
import React, { ReactNode } from "react";
import { Users } from "lucide-react";
import { useLocation } from "react-router-dom";

interface FeedHeaderProps {
  children?: ReactNode;
  showFeedTypeSelector?: boolean;
}

export function FeedHeader({
  children,
  showFeedTypeSelector = true
}: FeedHeaderProps) {
  const location = useLocation();
  const isFollowingPage = location.pathname === "/following";
  
  return (
    <div className="flex items-center justify-between">
      {!isFollowingPage && (
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Bookstr Community Across Nostr
        </h2>
      )}
      
      {showFeedTypeSelector && children && !isFollowingPage && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
