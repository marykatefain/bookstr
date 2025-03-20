
import React from "react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { GuestFeedCard } from "./social/GuestFeedCard";
import { Users } from "lucide-react";
import { BookstrGlobalFeed } from "./BookstrGlobalFeed";

export function SocialSection() {
  // Simple refresh function for the CreatePostBox
  const refreshFeed = () => {
    console.log("Post created successfully, feed will refresh on next polling cycle");
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
          <Users className="mr-2 h-5 w-5" />
          #Bookstr Community on Nostr
        </h2>
      </div>
      
      <div className="mb-6">
        {isLoggedIn() ? (
          <CreatePostBox onPostSuccess={refreshFeed} />
        ) : (
          <GuestFeedCard />
        )}
      </div>
      
      {/* New Bookstr Global Feed */}
      <BookstrGlobalFeed />
    </div>
  );
}
