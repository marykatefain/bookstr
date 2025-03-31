/**
 * NIP-05 Verification Utilities
 * Implements verification according to NIP-05 specification:
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */

// Cache for verification results to avoid repeated network requests
type VerificationCache = {
  result: boolean;
  timestamp: number;
};

const verificationCache = new Map<string, VerificationCache>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Parse a NIP-05 identifier into username and domain parts
 * @param nip05 The NIP-05 identifier (e.g., "user@example.com")
 * @returns The parsed parts or null if invalid
 */
export function parseNip05(nip05: string): { name: string; domain: string } | null {
  if (!nip05 || !nip05.includes('@')) {
    return null;
  }

  const parts = nip05.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return {
    name: parts[0],
    domain: parts[1],
  };
}

/**
 * Verify a NIP-05 identifier against the specified pubkey
 * @param nip05 The NIP-05 identifier to verify
 * @param pubkey The pubkey to check against
 * @returns Promise resolving to boolean indicating verification success
 */
export async function verifyNip05(nip05: string, pubkey: string): Promise<boolean> {
  if (!nip05 || !pubkey) {
    console.error("Missing NIP-05 or pubkey for verification");
    return false;
  }

  // Check cache first
  const cacheKey = `${nip05}:${pubkey}`;
  const now = Date.now();
  const cached = verificationCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached NIP-05 verification for ${nip05}:`, cached.result);
    return cached.result;
  }

  // Parse the NIP-05 identifier
  const parsed = parseNip05(nip05);
  if (!parsed) {
    console.error(`Invalid NIP-05 format: ${nip05}`);
    return false;
  }

  try {
    // According to NIP-05, we should query the well-known URL with the name parameter
    const url = `https://${parsed.domain}/.well-known/nostr.json?name=${encodeURIComponent(parsed.name)}`;
    console.log(`Verifying NIP-05 ${nip05} against ${url}`);

    // Fetch the JSON file from the domain
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch NIP-05 verification for ${nip05}: ${response.status} ${response.statusText}`);
      cacheNegativeResult(cacheKey);
      return false;
    }

    const data = await response.json();
    
    // Check if the response contains the expected structure
    if (!data.names || typeof data.names !== 'object') {
      console.warn(`Invalid NIP-05 response format for ${nip05}: Missing 'names' object`);
      cacheNegativeResult(cacheKey);
      return false;
    }

    // Look for the username in the names object
    const userPubkey = data.names[parsed.name];
    
    // Verify that the pubkey in the JSON matches the one we're checking
    const verified = userPubkey === pubkey;
    
    console.log(`NIP-05 verification for ${nip05} against ${pubkey}: ${verified}`);
    
    // Cache the result
    verificationCache.set(cacheKey, {
      result: verified,
      timestamp: now
    });
    
    return verified;
  } catch (error) {
    console.error(`Error verifying NIP-05 ${nip05}:`, error);
    cacheNegativeResult(cacheKey);
    return false;
  }
}

/**
 * Cache a negative verification result to prevent frequent retries
 */
function cacheNegativeResult(cacheKey: string): void {
  verificationCache.set(cacheKey, {
    result: false,
    timestamp: Date.now()
  });
}

/**
 * Clear the verification cache for testing or manual refresh
 */
export function clearVerificationCache(): void {
  verificationCache.clear();
  console.log("NIP-05 verification cache cleared");
}