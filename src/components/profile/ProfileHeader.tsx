
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Book, Link as LinkIcon, Settings, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditProfileModal } from "./EditProfileModal";
import { updateUserProfileEvent } from "@/lib/nostr";
import { getDisplayIdentifier, hasVerifiedIdentifier } from "@/lib/utils/user-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileHeaderProps {
  user: {
    picture?: string;
    name?: string;
    npub?: string;
    pubkey?: string;
    about?: string;
    nip05?: string;
    website?: string;
  } | null;
  toggleRelaySettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  toggleRelaySettings,
}) => {
  const { toast } = useToast();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const copyProfileLink = () => {
    // Use the pubkey instead of npub for the URL, and change the domain to bookstr.xyz
    // Also change /profile to /user in the path
    const pubkey = user?.pubkey || "";
    navigator.clipboard.writeText(`https://bookstr.xyz/user/${pubkey}`);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard"
    });
  };

  const handleUpdateProfile = async (displayName: string, bio: string, website?: string, nip05?: string): Promise<boolean> => {
    const success = await updateUserProfileEvent(displayName, bio, website, nip05);
    return success !== null;
  };

  const isVerified = hasVerifiedIdentifier(user || {});
  const displayId = getDisplayIdentifier(user || {});

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
        <img
          src={user?.picture || "https://i.pravatar.cc/300"}
          alt={user?.name || "User"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-bookverse-ink">
            {user?.name || "Nostr User"}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
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
          {user?.website && (
            <a 
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bookverse-accent hover:text-bookverse-highlight flex items-center gap-1 text-sm mt-1"
            >
              <LinkIcon className="h-3 w-3" />
              {user.website.replace(/^https?:\/\//i, '')}
            </a>
          )}
          <p className="mt-2">{user?.about || "No bio yet"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={copyProfileLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Profile Link
          </Button>
          <Button 
            size="sm" 
            className="bg-bookverse-accent hover:bg-bookverse-highlight"
            onClick={() => setShowEditProfileModal(true)}
          >
            <Book className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={toggleRelaySettings}>
            <Settings className="h-4 w-4 mr-2" />
            Relays
          </Button>
        </div>
      </div>
      
      <EditProfileModal
        open={showEditProfileModal}
        onOpenChange={setShowEditProfileModal}
        onSubmit={handleUpdateProfile}
        initialName={user?.name || ""}
        initialBio={user?.about || ""}
        initialWebsite={user?.website || ""}
        initialNip05={user?.nip05 || ""}
      />
    </div>
  );
};
