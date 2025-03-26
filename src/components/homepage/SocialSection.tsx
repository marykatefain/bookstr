import React, { useState } from "react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { GuestFeedCard } from "./social/GuestFeedCard";
import { Users } from "lucide-react";
import { UserPostsFeed } from "./UserPostsFeed";
export function SocialSection() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh function for the CreatePostBox
  const refreshFeed = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  return <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center py-[3px]">
          <Users className="mr-2 h-5 w-5" />
          #Bookstr Community on Nostr
        </h2>
      </div>
      
      <div className="mb-4">
        {isLoggedIn() ? <CreatePostBox onPostSuccess={refreshFeed} /> : <GuestFeedCard />}
      </div>
      
      {/* Global activity feed (changed from user's activity feed) */}
      <UserPostsFeed refreshTrigger={refreshTrigger} />
    </div>;
}