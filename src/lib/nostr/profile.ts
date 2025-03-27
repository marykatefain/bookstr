
import { NostrProfile, NostrEventData } from "./types";
import { connectToRelays } from "./relay";
import { getUserRelays } from "./relay";
import { getSharedPool } from "./utils/poolManager";
import { batchFetchUserProfiles } from "./fetch/profileFetch";

const parseProfileContent = (content: string): Partial<NostrProfile> => {
  try {
    const profileData = JSON.parse(content);
    return {
      name: profileData.name,
      display_name: profileData.display_name || profileData.displayName,
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
                
                clearTimeout(timeout);
                relayConnections.forEach(s => s.close());
                resolve({
                  ...profileData,
                  pubkey
                });
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
    const profilesMap = await batchFetchUserProfiles(pubkeys);
    return Array.from(profilesMap.values());
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
}
