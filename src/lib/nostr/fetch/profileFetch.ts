
import { type Filter } from "nostr-tools";
import { NostrProfile, FollowList, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";

// Simple in-memory cache for profiles
const profileCache = new Map<string, { profile: NostrProfile, timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Get the list of users a person follows
 */
export async function fetchFollowingList(pubkey: string): Promise<FollowList> {
  console.log(`Fetching follow list for pubkey: ${pubkey}`);
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.CONTACTS],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} contact events for ${pubkey}`);
    
    // Use the most recent CONTACTS event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!latestEvent) {
      console.log(`No contact events found for ${pubkey}`);
      return { follows: [] };
    }
    
    // Extract followed pubkeys from p tags
    const follows = latestEvent.tags
      .filter(tag => tag[0] === 'p')
      .map(tag => tag[1]);
    
    console.log(`Found ${follows.length} follows for ${pubkey}`);
    return { follows };
  } catch (error) {
    console.error("Error fetching following list:", error);
    return { follows: [] };
  }
}

/**
 * Validate if a user has a proper follow list on the relays
 */
export async function validateFollowList(pubkey: string): Promise<{isValid: boolean; followCount: number}> {
  const { follows } = await fetchFollowingList(pubkey);
  return {
    isValid: follows.length > 0,
    followCount: follows.length
  };
}

/**
 * Fetch profile for a user with caching
 */
export async function fetchUserProfile(pubkey: string): Promise<NostrProfile | null> {
  if (!pubkey) {
    console.error("Missing pubkey parameter in fetchUserProfile");
    return null;
  }

  // Check cache first
  const now = Date.now();
  const cachedProfile = profileCache.get(pubkey);
  if (cachedProfile && now - cachedProfile.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached profile for ${pubkey}`);
    return cachedProfile.profile;
  }

  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: [pubkey]
    };
    
    console.log(`Fetching profile for ${pubkey} from relays:`, relays);
    const events = await pool.querySync(relays, filter);
    console.log(`Received ${events.length} profile events for ${pubkey}`);
    
    // Use the most recent profile event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    let profile: NostrProfile;
    
    if (!latestEvent) {
      console.log(`No profile events found for ${pubkey}`);
      // Return a minimal profile with just the pubkey
      profile = {
        npub: pubkey,
        pubkey: pubkey,
        name: "",
        relays: []
      };
    } else {
      try {
        const profileData = JSON.parse(latestEvent.content);
        console.log(`Parsed profile data for ${pubkey}:`, profileData);
        
        profile = {
          npub: pubkey, // This will be converted to npub format in the UI
          pubkey: pubkey,
          name: profileData.name,
          display_name: profileData.display_name,
          picture: profileData.picture,
          about: profileData.about,
          website: profileData.website,
          lud16: profileData.lud16,
          banner: profileData.banner,
          relays: []
        };
      } catch (error) {
        console.error("Error parsing profile data:", error);
        profile = {
          npub: pubkey,
          pubkey: pubkey,
          name: "",
          relays: []
        };
      }
    }
    
    // Save to cache
    profileCache.set(pubkey, { profile, timestamp: now });
    
    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      npub: pubkey,
      pubkey: pubkey,
      name: "",
      relays: []
    };
  }
}

/**
 * Batch fetch multiple profiles at once
 */
export async function batchFetchUserProfiles(pubkeys: string[]): Promise<Map<string, NostrProfile>> {
  if (!pubkeys.length) return new Map();
  
  const uniquePubkeys = [...new Set(pubkeys)];
  const result = new Map<string, NostrProfile>();
  const pubkeysToFetch: string[] = [];
  
  // Check cache first
  const now = Date.now();
  uniquePubkeys.forEach(pubkey => {
    const cachedProfile = profileCache.get(pubkey);
    if (cachedProfile && now - cachedProfile.timestamp < CACHE_EXPIRY) {
      result.set(pubkey, cachedProfile.profile);
    } else {
      pubkeysToFetch.push(pubkey);
    }
  });
  
  if (pubkeysToFetch.length === 0) {
    return result;
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    const events = await pool.querySync(relays, {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: pubkeysToFetch
    });
    
    // Group events by author (pubkey)
    const eventsByAuthor = new Map();
    events.forEach(event => {
      const pubkey = event.pubkey;
      if (!eventsByAuthor.has(pubkey)) {
        eventsByAuthor.set(pubkey, []);
      }
      eventsByAuthor.get(pubkey).push(event);
    });
    
    // Process each author's events
    for (const pubkey of pubkeysToFetch) {
      const authorEvents = eventsByAuthor.get(pubkey) || [];
      
      if (authorEvents.length === 0) {
        // No profile found, use minimal profile
        const minimalProfile: NostrProfile = {
          npub: pubkey,
          pubkey: pubkey,
          name: "",
          relays: []
        };
        
        result.set(pubkey, minimalProfile);
        profileCache.set(pubkey, { profile: minimalProfile, timestamp: now });
        continue;
      }
      
      // Find latest event
      const latestEvent = authorEvents.sort((a, b) => b.created_at - a.created_at)[0];
      
      try {
        const profileData = JSON.parse(latestEvent.content);
        
        const profile: NostrProfile = {
          npub: pubkey,
          pubkey: pubkey,
          name: profileData.name,
          display_name: profileData.display_name,
          picture: profileData.picture,
          about: profileData.about,
          website: profileData.website,
          lud16: profileData.lud16,
          banner: profileData.banner,
          relays: []
        };
        
        result.set(pubkey, profile);
        profileCache.set(pubkey, { profile, timestamp: now });
      } catch (error) {
        console.error(`Error parsing profile for ${pubkey}:`, error);
        const minimalProfile: NostrProfile = {
          npub: pubkey,
          pubkey: pubkey,
          name: "",
          relays: []
        };
        
        result.set(pubkey, minimalProfile);
        profileCache.set(pubkey, { profile: minimalProfile, timestamp: now });
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error batch fetching profiles:", error);
    
    // Return minimal profiles for any pubkeys we couldn't fetch
    for (const pubkey of pubkeysToFetch) {
      if (!result.has(pubkey)) {
        const minimalProfile: NostrProfile = {
          npub: pubkey,
          pubkey: pubkey,
          name: "",
          relays: []
        };
        
        result.set(pubkey, minimalProfile);
      }
    }
    
    return result;
  }
}
