
import React from "react";
import { Users } from "lucide-react";
import { FeedTypeSelector } from "./FeedTypeSelector";
import { RefreshButton } from "./RefreshButton";

interface FeedHeaderProps {
  feedType: "followers" | "global";
  setFeedType: (type: "followers" | "global") => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoggedIn: boolean;
}

export function FeedHeader({
  feedType,
  setFeedType,
  onRefresh,
  isRefreshing,
  isLoggedIn
}: FeedHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
        <Users className="mr-2 h-5 w-5" />
        #Bookstr Community on Nostr
      </h2>
      
      <div className="flex items-center gap-2">
        <FeedTypeSelector 
          feedType={feedType} 
          setFeedType={setFeedType} 
          isLoggedIn={isLoggedIn} 
        />
        
        <RefreshButton 
          onRefresh={onRefresh} 
          isRefreshing={isRefreshing} 
        />
      </div>
    </div>
  );
}
