/**
 * Utility functions for displaying user identifiers in a consistent way
 */
import { verifyNip05 } from '@/lib/nostr/verification';

// Cache for NIP-05 verification status
// Maps nip05 to { verified: boolean, timestamp: number }
const verificationStatusCache = new Map<string, { verified: boolean; checking: boolean; timestamp: number; }>();
const VERIFICATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Format a pubkey or npub for display
 * @param pubkey The full pubkey or npub
 * @returns A shortened version for display
 */
export function formatPubkey(pubkey: string): string {
  if (!pubkey) return '';
  
  // If it's an npub, format it as npub1...xxxx
  if (pubkey.startsWith('npub1')) {
    return `${pubkey.substring(0, 5)}...${pubkey.substring(pubkey.length - 4)}`;
  }
  
  // If it's a hex pubkey, format it as similar shortened form
  return `${pubkey.substring(0, 5)}...${pubkey.substring(pubkey.length - 4)}`;
}

/**
 * Returns the preferred display identifier for a user
 * Uses NIP-05 if available, falls back to shortened npub/pubkey
 * 
 * @param profile User profile object
 * @returns The identifier to display
 */
export function getDisplayIdentifier(profile: { nip05?: string; npub?: string; pubkey?: string; }): string {
  // Show NIP-05 if available
  if (profile?.nip05) {
    return profile.nip05;
  }
  
  // Fall back to npub if available
  if (profile?.npub) {
    return formatPubkey(profile.npub);
  }
  
  // Last resort: format the pubkey
  if (profile?.pubkey) {
    return formatPubkey(profile.pubkey);
  }
  
  return 'Unknown user';
}

/**
 * Get the verification status of a NIP-05 identifier
 * 
 * Returns an object with the following properties:
 * - verified: boolean - whether the identifier has been verified
 * - checking: boolean - whether verification is in progress
 * 
 * This is used for UI state management (showing loading indicators, etc.)
 */
export function getNip05VerificationStatus(nip05: string, pubkey: string): { verified: boolean; checking: boolean; } {
  if (!nip05 || !pubkey) {
    return { verified: false, checking: false };
  }

  const cacheKey = `${nip05}:${pubkey}`;
  const cachedStatus = verificationStatusCache.get(cacheKey);
  const now = Date.now();

  if (cachedStatus && now - cachedStatus.timestamp < VERIFICATION_CACHE_TTL) {
    return { 
      verified: cachedStatus.verified, 
      checking: cachedStatus.checking 
    };
  }

  // Start the verification process asynchronously
  verificationStatusCache.set(cacheKey, {
    verified: false,
    checking: true,
    timestamp: now
  });

  // Perform the actual verification in the background
  verifyNip05(nip05, pubkey)
    .then(verified => {
      verificationStatusCache.set(cacheKey, {
        verified,
        checking: false,
        timestamp: now
      });
    })
    .catch(error => {
      console.error(`Error verifying NIP-05 ${nip05}:`, error);
      verificationStatusCache.set(cacheKey, {
        verified: false,
        checking: false,
        timestamp: now
      });
    });

  // Return the current status (checking)
  return { verified: false, checking: true };
}

/**
 * Determines if a profile has properly verified NIP-05 identifier
 * This performs actual verification against the domain
 */
export function hasVerifiedNip05(profile: { nip05?: string; pubkey?: string }, forceCheck = false): boolean {
  if (!profile?.nip05 || !profile?.pubkey) {
    return false;
  }

  const { verified, checking } = getNip05VerificationStatus(profile.nip05, profile.pubkey);
  
  // If we're still checking and this is not a forced check, return false
  // This prevents showing the checkmark until verification completes
  if (checking && !forceCheck) {
    return false;
  }
  
  return verified;
}

/**
 * Determines if a profile has an unverified NIP-05 identifier
 * (has a NIP-05 that was checked but failed verification)
 */
export function hasUnverifiedNip05(profile: { nip05?: string; pubkey?: string }): boolean {
  if (!profile?.nip05 || !profile?.pubkey) {
    return false;
  }

  const { verified, checking } = getNip05VerificationStatus(profile.nip05, profile.pubkey);
  
  // If we're still checking or it's verified, it's not unverified
  if (checking || verified) {
    return false;
  }
  
  // Has NIP-05, not checking anymore, and not verified = unverified
  return true;
}

/**
 * Determines if a profile has a verified identifier (NIP-05)
 * @deprecated Use hasVerifiedNip05 instead which actually verifies the NIP-05
 */
export function hasVerifiedIdentifier(profile: { nip05?: string; }): boolean {
  // For backward compatibility, just check if NIP-05 exists
  return !!profile?.nip05;
}