
import { nip19 } from "nostr-tools";

export function formatPubkey(pubkey: string): string {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
  } catch {
    return `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;
  }
}
