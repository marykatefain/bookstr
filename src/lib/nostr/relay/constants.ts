
// Default relays used as fallbacks
export const DEFAULT_RELAYS = ["wss://ditto.pub/relay", "wss://relay.nostr.band", "wss://relay.damus.io"];

// Connection timing parameters
export const CONNECTION_COOLDOWN = 2000; // 2 seconds cooldown between connection attempts
export const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout for connections

// Local storage keys
export const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';
export const NOSTR_USER_KEY = 'bookverse_nostr_user';
