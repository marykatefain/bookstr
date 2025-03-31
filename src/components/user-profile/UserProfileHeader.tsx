
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Plus, AlertTriangle, CheckCircle2, ExternalLink, Link as LinkIcon } from "lucide-react";
import { NostrProfile } from "@/lib/nostr/types";
import { nip19 } from "nostr-tools";
import { isLoggedIn, fetchFollowingList, followUser } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDisplayIdentifier, hasVerifiedIdentifier } from "@/lib/utils/user-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const isVerified = hasVerifiedIdentifier(profile);
  const displayId = getDisplayIdentifier(profile);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24 border-2 border-bookverse-accent">
        <AvatarImage src={profile?.picture} />
        <AvatarFallback className="text-xl">
          {(profile?.name?.[0] || 'U').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {profile?.name || formatPubkey(profile?.npub || '')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
          {displayId}
          {isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="h-4 w-4 text-green-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <div className="space-y-2">
                    <p>This user has a verified NIP-05 identifier.</p>
                    <a 
                      href="https://nostr.how/en/guides/get-verified"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-bookverse-accent hover:text-bookverse-highlight"
                    >
                      What is NIP-05 Identity? <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
