
export interface NostrProfile {
  npub: string;
  pubkey: string;
  name?: string;
  picture?: string;
  about?: string;
  website?: string;
  lud16?: string;
  banner?: string;
  nip05?: string;  // Add NIP-05 field
  relays: string[];
  content?: string;  // Added content field to support raw profile event content
}

export interface FollowList {
  follows: string[];
}

export const DEFAULT_PROFILE: NostrProfile = {
  npub: "npub1Default",
  pubkey: "Default",
  name: "Bookworm",
  picture: "https://i.pravatar.cc/300",
  about: "I love books!",
  relays: []
};
