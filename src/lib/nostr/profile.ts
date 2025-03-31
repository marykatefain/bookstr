
import { NostrProfile, NostrEventData } from "./types";
import { connectToRelays } from "./relay";
import { getUserRelays } from "./relay";
import { getSharedPool } from "./utils/poolManager";
import { batchFetchUserProfiles } from "./fetch/profileFetch";

// Add a memory cache for profile data with a TTL of 10 minutes
const profileCache = new Map<string, {data: Partial<NostrProfile>, timestamp: number}>();
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const parseProfileContent = (content: string): Partial<NostrProfile> => {
  try {
    const profileData = JSON.parse(content);
    return {
      name: profileData.name,
      picture: profileData.picture,
      about: profileData.about
    };
  } catch (error) {
    console.error("Failed to parse profile data:", error);
    return {};
  }
};

export async function fetchProfileData(pubkey: string): Promise<Partial<NostrProfile> | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (profileCache.has(pubkey)) {
      const cached = profileCache.get(pubkey)!;
      if (now - cached.timestamp < PROFILE_CACHE_TTL) {
        console.log("Using cached profile for", pubkey.slice(0, 8));
        return cached.data;
      } else {
        // Cache expired, remove it
        profileCache.delete(pubkey);
      }
    }
    
    const relayConnections = await connectToRelays();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        relayConnections.forEach(socket => socket.close());
        resolve(null);
      }, 5000);
      
      relayConnections.forEach(socket => {
        const subscriptionId = `profile-${Math.random().toString(36).substring(2, 15)}`;
        const requestMessage = JSON.stringify([
          "REQ", 
          subscriptionId,
          {
            "kinds": [0],
            "authors": [pubkey]
            // Removed the "limit": 1 parameter to get all available events
          }
        ]);
        
        socket.send(requestMessage);
        
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message[0] === "EVENT" && message[1] === subscriptionId) {
              const profileEvent = message[2] as NostrEventData;
              
              if (profileEvent.kind === 0 && profileEvent.pubkey === pubkey) {
                const profileData = parseProfileContent(profileEvent.content);
                const result = {
                  ...profileData,
                  pubkey
                };
                
                // Cache the result
                profileCache.set(pubkey, {
                  data: result,
                  timestamp: Date.now()
                });
                
                clearTimeout(timeout);
                relayConnections.forEach(s => s.close());
                resolve(result);
              }
            }
            
            if (message[0] === "EOSE" && message[1] === subscriptionId) {
              socket.close();
            }
          } catch (error) {
            console.error("Error processing relay message:", error);
          }
        };
        
        socket.onerror = (error) => {
          console.error("Relay connection error:", error);
          socket.close();
        };
      });
    });
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return null;
  }
}

/**
 * Fetch multiple user profiles at once using the optimized batch fetching
 */
export async function fetchUserProfiles(pubkeys: string[]): Promise<Partial<NostrProfile>[]> {
  if (!pubkeys.length) return [];
  
  try {
    // First check what we already have in cache
    const now = Date.now();
    const uncachedPubkeys: string[] = [];
    const results: Partial<NostrProfile>[] = [];
    
    // Check cache first for each pubkey
    for (const pubkey of pubkeys) {
      if (profileCache.has(pubkey)) {
        const cached = profileCache.get(pubkey)!;
        if (now - cached.timestamp < PROFILE_CACHE_TTL) {
          results.push(cached.data);
        } else {
          // Cache expired
          profileCache.delete(pubkey);
          uncachedPubkeys.push(pubkey);
        }
      } else {
        uncachedPubkeys.push(pubkey);
      }
    }
    
    // If all profiles were in cache, return them
    if (uncachedPubkeys.length === 0) {
      console.log("All profiles found in cache:", pubkeys.length);
      return results;
    }
    
    // Fetch the uncached profiles
    console.log(`Fetching ${uncachedPubkeys.length} uncached profiles`);
    const profilesMap = await batchFetchUserProfiles(uncachedPubkeys);
    
    // Add the newly fetched profiles to results and cache
    for (const [pubkey, profile] of profilesMap.entries()) {
      results.push(profile);
      
      // Add to cache
      profileCache.set(pubkey, {
        data: profile,
        timestamp: now
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
}
