
import React, { useState, useEffect } from "react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { GuestFeedCard } from "./social/GuestFeedCard";
import { Users } from "lucide-react";
import { UserPostsFeed } from "./UserPostsFeed";

export function SocialSection() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);
  
  // Check login state periodically
  useEffect(() => {
    // Check login state initially
    setIsUserLoggedIn(isLoggedIn());
    
    // Setup an interval to check login state
    const checkLoginInterval = setInterval(() => {
      const loginState = isLoggedIn();
      if (loginState !== isUserLoggedIn) {
        setIsUserLoggedIn(loginState);
        // Also refresh feed when login state changes
        setRefreshTrigger(prev => prev + 1);
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(checkLoginInterval);
  }, [isUserLoggedIn]);

  // Refresh function for the CreatePostBox
  const refreshFeed = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center py-[3px]">
          <Users className="mr-2 h-5 w-5" />
          Bookstr Community Across Nostr
        </h2>
      </div>
      
      <div className="mb-4">
        {isUserLoggedIn ? <CreatePostBox onPostSuccess={refreshFeed} /> : <GuestFeedCard onLoginSuccess={() => setIsUserLoggedIn(true)} />}
      </div>
      
      {/* Global activity feed (changed from user's activity feed) */}
      <UserPostsFeed refreshTrigger={refreshTrigger} />
    </div>
  );
}
