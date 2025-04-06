/**
 * Utility functions for working with hashes and pubkeys
 */

/**
 * Shortens a hash for display purposes
 * @param hash The hash to shorten
 * @returns The shortened hash (first 6 chars + ... + last 6 chars)
 */
export function shortenHash(hash: string): string {
  if (!hash || hash.length < 15) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}