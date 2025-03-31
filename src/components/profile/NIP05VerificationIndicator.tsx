import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getNip05VerificationStatus, hasVerifiedNip05, hasUnverifiedNip05 } from "@/lib/utils/user-display";

interface NIP05VerificationIndicatorProps {
  nip05: string | undefined;
  pubkey: string | undefined;
}

/**
 * A component that displays the verification status of a NIP-05 identifier
 * Shows different icons based on verification status:
 * - Green checkmark for verified identifiers
 * - Red X for unverified identifiers
 * - Loading spinner when verification is in progress
 */
export const NIP05VerificationIndicator: React.FC<NIP05VerificationIndicatorProps> = ({ 
  nip05, 
  pubkey 
}) => {
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [unverified, setUnverified] = useState(false);

  // Update verification status periodically
  useEffect(() => {
    if (!nip05 || !pubkey) {
      setChecking(false);
      setVerified(false);
      setUnverified(false);
      return;
    }

    // Initial check
    updateVerificationStatus();

    // Check periodically for updates
    const interval = setInterval(updateVerificationStatus, 1000);
    return () => clearInterval(interval);
  }, [nip05, pubkey]);

  const updateVerificationStatus = () => {
    if (!nip05 || !pubkey) return;

    const status = getNip05VerificationStatus(nip05, pubkey);
    setChecking(status.checking);
    setVerified(hasVerifiedNip05({ nip05, pubkey }));
    setUnverified(hasUnverifiedNip05({ nip05, pubkey }));
  };

  // If no NIP-05 or pubkey, don't show anything
  if (!nip05 || !pubkey) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {checking && !verified && !unverified && (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {verified && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {unverified && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="space-y-2">
            {checking && !verified && !unverified && (
              <p>Verifying NIP-05 identifier...</p>
            )}
            {verified && (
              <p>This user has a verified NIP-05 identifier.</p>
            )}
            {unverified && (
              <p className="text-red-400">
                Could not verify this NIP-05 identifier. It may be misconfigured or the domain is unreachable.
              </p>
            )}
            <a 
              href="https://nostr.how/en/guides/get-verified"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-bookverse-accent hover:text-bookverse-highlight"
            >
              What is NIP-05 Identity?
            </a>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};