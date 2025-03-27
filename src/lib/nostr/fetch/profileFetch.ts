
import { type Filter } from "nostr-tools";
import { NostrProfile, FollowList, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";

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
 * Fetch profile for a user
 */
export async function fetchUserProfile(pubkey: string): Promise<NostrProfile | null> {
  if (!pubkey) {
    console.error("Missing pubkey parameter in fetchUserProfile");
    return null;
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
    
    if (!latestEvent) {
      console.log(`No profile events found for ${pubkey}`);
      // Return a minimal profile with just the pubkey
      return {
        npub: pubkey,
        pubkey: pubkey,
        name: "",
        relays: []
      };
    }
    
    try {
      const profileData = JSON.parse(latestEvent.content);
      console.log(`Parsed profile data for ${pubkey}:`, profileData);
      
      return {
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
      return {
        npub: pubkey,
        pubkey: pubkey,
        name: "",
        relays: []
      };
    }
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
