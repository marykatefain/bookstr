
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Plus, 
  AlertTriangle, 
  ExternalLink, 
  Link as LinkIcon,
  ShieldAlert
} from "lucide-react";
import { NostrProfile } from "@/lib/nostr/types";
import { nip19 } from "nostr-tools";
import { 
  isLoggedIn, 
  fetchFollowingList, 
  followUser,
  isBlocked
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDisplayIdentifier } from "@/lib/utils/user-display";
import { NIP05VerificationIndicator } from "@/components/profile/NIP05VerificationIndicator";

interface UserProfileHeaderProps {
  profile: NostrProfile | null;
  following: boolean;
  setFollowing: (following: boolean) => void;
  currentUserPubkey?: string;
  onFollow?: (pubkey: string) => Promise<void>;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  following,
  setFollowing,
  currentUserPubkey,
  onFollow
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
      
      if (onFollow) {
        await onFollow(profile.pubkey);
      } else {
        // Keep original follow logic as fallback
        // This code should be removed once all components use the new pattern
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

  const displayId = getDisplayIdentifier(profile);
  const profIsBlocked = isBlocked(profile.pubkey);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className={`h-24 w-24 ${profIsBlocked ? 'border-2 border-red-400 dark:border-red-800' : 'border-2 border-bookverse-accent'}`}>
        <AvatarImage src={profile?.picture} />
        <AvatarFallback className="text-xl">
          {(profile?.name?.[0] || 'U').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          {profile?.name || formatPubkey(profile?.npub || '')}
          {profile && isBlocked(profile.pubkey) && (
            <span 
              className="text-red-600 dark:text-red-500 text-sm bg-red-100 dark:bg-red-900/30 p-1 px-2 rounded-md flex items-center"
              title="This user has been blocked from the platform"
            >
              <ShieldAlert className="h-3 w-3 mr-1" />
              Blocked
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
          {displayId}
          {profile?.nip05 && profile?.pubkey && (
            <NIP05VerificationIndicator nip05={profile.nip05} pubkey={profile.pubkey} />
          )}
        </p>
        {profile?.website && (
          <a 
            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bookverse-accent hover:text-bookverse-highlight flex items-center justify-center gap-1 text-sm mt-1"
          >
            <LinkIcon className="h-3 w-3" />
            {profile.website.replace(/^https?:\/\//i, '')}
          </a>
        )}
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
          disabled={following || followLoading || profIsBlocked}
          variant={profIsBlocked ? "destructive" : (following ? "outline" : "default")}
        >
          {profIsBlocked ? (
            <>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Blocked Account
            </>
          ) : following ? (
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
