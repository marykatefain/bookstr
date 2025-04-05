import blocklistData from '../blocklist.json';

/**
 * Interface for a blocked user entry in the blocklist
 */
interface BlockedUser {
  pubkey: string;
  reason: string;
  notes: string;
}

/**
 * Interface for the blocklist data structure
 */
interface BlocklistData {
  blockedUsers: BlockedUser[];
}

// Cast the imported data to the correct type
const typedBlocklistData = blocklistData as BlocklistData;

/**
 * Get the list of blocked pubkeys
 */
export function getBlockedPubkeys(): string[] {
  return typedBlocklistData.blockedUsers.map((user: BlockedUser) => user.pubkey);
}

/**
 * Check if a pubkey is in the blocklist
 * @param pubkey The pubkey to check
 */
export function isBlocked(pubkey: string): boolean {
  return typedBlocklistData.blockedUsers.some((user: BlockedUser) => user.pubkey === pubkey);
}

/**
 * Get the reason a pubkey is blocked (if it is)
 * @param pubkey The pubkey to check
 */
export function getBlockReason(pubkey: string): string | null {
  const blockedUser = typedBlocklistData.blockedUsers.find((user: BlockedUser) => user.pubkey === pubkey);
  return blockedUser ? blockedUser.reason : null;
}

/**
 * Filter an array of events to exclude those from blocked users
 * @param events Array of events to filter
 */
export function filterBlockedEvents<T extends { pubkey: string }>(events: T[]): T[] {
  const blockedPubkeys = getBlockedPubkeys();
  return events.filter(event => !blockedPubkeys.includes(event.pubkey));
}