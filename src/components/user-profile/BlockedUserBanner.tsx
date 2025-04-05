import React from "react";
import { NostrProfile } from "@/lib/nostr/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";
import { getBlockReason } from "@/lib/nostr";

interface BlockedUserBannerProps {
  profile: NostrProfile;
  showContent: boolean;
  onToggleContent: () => void;
}

export const BlockedUserBanner: React.FC<BlockedUserBannerProps> = ({ 
  profile,
  showContent,
  onToggleContent
}) => {
  const blockReason = getBlockReason(profile.pubkey);
  
  return (
    <Alert className="my-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
      <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-600 dark:text-red-400 font-medium">
        Blocked Account
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-red-600/80 dark:text-red-400/80">
          This user has been blocked from the platform
          {blockReason && (
            <>: <span className="font-medium">{blockReason}</span></>
          )}
        </p>
        
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
            onClick={onToggleContent}
          >
            {showContent ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide profile content
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View profile content
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};