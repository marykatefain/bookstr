
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Plus, AlertTriangle } from "lucide-react";
import { NostrProfile } from "@/lib/nostr/types";
import { nip19 } from "nostr-tools";
import { followUser, isLoggedIn, fetchFollowingList } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfileHeaderProps {
  profile: NostrProfile | null;
  following: boolean;
  setFollowing: (following: boolean) => void;
  currentUserPubkey?: string;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  following,
  setFollowing,
  currentUserPubkey
}) => {
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowWarning, setShowFollowWarning] = useState(false);
  const { toast } = useToast();
  
  const formatPubkey = (key: string): string => {
    try {
      const npub = nip19.npubEncode(key);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${key.slice(0, 6)}...${key.slice(-4)}`;
    }
  };
  
  const handleFollow = async () => {
    if (!profile || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }
    
    setFollowLoading(true);
    try {
      // Check if the user has any existing follows
      if (currentUserPubkey) {
        const { follows } = await fetchFollowingList(currentUserPubkey);
        if (follows.length === 0) {
          setShowFollowWarning(true);
        }
      }
      
      const result = await followUser(profile.pubkey);
      
      if (result !== null) {
        setFollowing(true);
        toast({
          title: "Success",
          description: `You are now following ${profile.name || 'this user'}`
        });
      } else if (following) {
        toast({
          title: "Already following",
          description: `You already follow ${profile.name || 'this user'}`
        });
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Could not follow user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24 border-2 border-bookverse-accent">
        <AvatarImage src={profile?.picture} />
        <AvatarFallback className="text-xl">
          {(profile?.name || profile?.display_name || 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {profile?.name || profile?.display_name || formatPubkey(profile?.pubkey || '')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile?.pubkey ? formatPubkey(profile.pubkey) : ''}
        </p>
      </div>
      
      {profile?.about && (
        <p className="text-center max-w-lg text-muted-foreground">
          {profile.about}
        </p>
      )}
      
      {showFollowWarning && (
        <Alert variant="warning" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This appears to be your first follow. If you already follow others but they're not showing, please ensure your follow list is synced to the relays first.
          </AlertDescription>
        </Alert>
      )}
      
      {currentUserPubkey && profile && currentUserPubkey !== profile.pubkey && (
        <Button 
          onClick={handleFollow} 
          disabled={following || followLoading}
          variant={following ? "outline" : "default"}
        >
          {following ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Following
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
};
