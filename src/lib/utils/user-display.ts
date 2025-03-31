/**
 * Utility functions for displaying user identifiers in a consistent way
 */

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
 * Determines if a profile has a verified identifier (NIP-05)
 */
export function hasVerifiedIdentifier(profile: { nip05?: string; }): boolean {
  return !!profile?.nip05;
}