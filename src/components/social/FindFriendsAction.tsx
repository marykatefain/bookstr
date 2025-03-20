
import React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FindFriendsActionProps {
  onFindFriends?: () => void;
}

export function FindFriendsAction({ onFindFriends }: FindFriendsActionProps) {
  const handleFindFriends = () => {
    // Default implementation to find the find-friends tab
    const findFriendsTab = document.querySelector('[value="find-friends"]');
    if (findFriendsTab && findFriendsTab instanceof HTMLElement) {
      findFriendsTab.click();
    }
    
    // Call the provided handler if available
    if (onFindFriends) {
      onFindFriends();
    }
  };
  
  return (
    <Link to="/social">
      <Button onClick={handleFindFriends}>
        <UserPlus className="mr-2 h-4 w-4" />
        Find Friends
      </Button>
    </Link>
  );
}
