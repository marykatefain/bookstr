
import { NostrProfile, NostrEventData } from "./types";
import { connectToRelays } from "./relay";

const parseProfileContent = (content: string): Partial<NostrProfile> => {
  try {
    const profileData = JSON.parse(content);
    return {
      name: profileData.name,
      displayName: profileData.display_name || profileData.displayName,
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
            "authors": [pubkey],
            "limit": 1
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
