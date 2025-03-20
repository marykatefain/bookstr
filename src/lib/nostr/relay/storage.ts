
import { NostrProfile } from "../types";
import { toast } from "@/hooks/use-toast";
import { 
  NOSTR_RELAYS_KEY,
  NOSTR_USER_KEY,
  DEFAULT_RELAYS
} from './constants';
import { userRelays, setUserRelays } from './state';
import { connectToRelays, closeActiveConnections } from './connection';

/**
 * Load saved relays from local storage
 */
export function loadRelaysFromStorage(): void {
  try {
    const savedRelays = localStorage.getItem(NOSTR_RELAYS_KEY);
    if (savedRelays) {
      const parsedRelays = JSON.parse(savedRelays);
      if (Array.isArray(parsedRelays) && parsedRelays.length > 0) {
        setUserRelays(parsedRelays);
      }
    }
  } catch (error) {
    console.error("Failed to load relays from storage:", error);
  }
}

/**
 * Get user's configured relays
 */
export function getUserRelays(): string[] {
  loadRelaysFromStorage();
  return [...userRelays]; // Return a copy to avoid direct mutation
}

/**
 * Add a new relay to the user's relay list
 */
export function addRelay(relayUrl: string, currentUser: NostrProfile | null): boolean {
  if (userRelays.includes(relayUrl)) {
    toast({
      title: "Relay already added",
      description: `${relayUrl} is already in your relays list`,
    });
    return false;
  }
  
  try {
    // Test connection to the relay first
    const ws = new WebSocket(relayUrl);
    
    // We'll set up a promise to handle the WebSocket connection
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        // If connection takes too long, abort
        ws.close();
        toast({
          title: "Connection timeout",
          description: `Could not connect to ${relayUrl}`,
          variant: "destructive",
        });
        resolve(false);
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        // Successfully connected, update relay list
        const updatedRelays = [...userRelays, relayUrl];
        setUserRelays(updatedRelays);
        localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(updatedRelays));
        
        // Update user profile if available
        if (currentUser) {
          currentUser.relays = [...updatedRelays];
          localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
        }
        
        // Close the test connection
        ws.close();
        
        // Reconnect to all relays including the new one
        closeActiveConnections();
        
        connectToRelays().catch(err => 
          console.error("Failed to reconnect after adding relay:", err)
        );
        
        toast({
          title: "Relay added",
          description: `Added ${relayUrl} to your relays`,
        });
        
        resolve(true);
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        toast({
          title: "Invalid relay",
          description: `Could not connect to ${relayUrl}`,
          variant: "destructive",
        });
        ws.close();
        resolve(false);
      };
    }) as unknown as boolean; // Type assertion to match return type
  } catch (error) {
    console.error("Error adding relay:", error);
    toast({
      title: "Error adding relay",
      description: `Failed to add ${relayUrl}: ${error instanceof Error ? error.message : "Unknown error"}`,
      variant: "destructive",
    });
    return false;
  }
}

/**
 * Remove a relay from the user's relay list
 */
export function removeRelay(relayUrl: string, currentUser: NostrProfile | null): boolean {
  if (!userRelays.includes(relayUrl) || relayUrl === DEFAULT_RELAYS[0]) {
    return false;
  }
  
  const updatedRelays = userRelays.filter(r => r !== relayUrl);
  setUserRelays(updatedRelays);
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(updatedRelays));
  
  if (currentUser) {
    currentUser.relays = [...updatedRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  // Close all connections and reconnect to updated relay list
  closeActiveConnections();
  
  connectToRelays().catch(err => 
    console.error("Failed to reconnect after removing relay:", err)
  );
  
  toast({
    title: "Relay removed",
    description: `Removed ${relayUrl} from your relays`,
  });
  
  return true;
}

/**
 * Reset relays to default values
 */
export function resetRelays(currentUser: NostrProfile | null): void {
  setUserRelays([...DEFAULT_RELAYS]);
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify([...DEFAULT_RELAYS]));
  
  if (currentUser) {
    currentUser.relays = [...DEFAULT_RELAYS];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  closeActiveConnections();
  
  connectToRelays().catch(err => 
    console.error("Failed to reconnect after resetting relays:", err)
  );
  
  toast({
    title: "Relays reset",
    description: "Your relays have been reset to default",
  });
}
