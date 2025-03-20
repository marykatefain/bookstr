
import React from "react";
import { Users, Globe } from "lucide-react";

interface FeedTypeSelectorProps {
  feedType: "followers" | "global";
  setFeedType: (type: "followers" | "global") => void;
  isLoggedIn: boolean;
}

export function FeedTypeSelector({ feedType, setFeedType, isLoggedIn }: FeedTypeSelectorProps) {
  if (!isLoggedIn) return null;
  
  return (
    <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      <button
        onClick={() => setFeedType("followers")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          feedType === "followers" 
            ? "bg-background text-foreground shadow-sm" 
            : ""
        }`}
      >
        <Users className="h-4 w-4 mr-2" />
        <span>Following</span>
      </button>
      <button
        onClick={() => setFeedType("global")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          feedType === "global" 
            ? "bg-background text-foreground shadow-sm" 
            : ""
        }`}
      >
        <Globe className="h-4 w-4 mr-2" />
        <span>Global</span>
      </button>
    </div>
  );
}
