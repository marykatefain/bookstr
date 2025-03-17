
import { toast } from "@/hooks/use-toast";
import { NostrProfile } from "./types";

export const DEFAULT_RELAYS = ["wss://ditto.pub/relay"];
let userRelays = [...DEFAULT_RELAYS];

const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';
const NOSTR_USER_KEY = 'bookverse_nostr_user';

export async function connectToRelays(relays: string[] = userRelays): Promise<WebSocket[]> {
  const connections: WebSocket[] = [];
  
  for (const relayUrl of relays) {
    try {
      const socket = new WebSocket(relayUrl);
      
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
        
        setTimeout(() => reject(new Error(`Connection timeout for ${relayUrl}`)), 5000);
      });
      
      connections.push(socket);
    } catch (error) {
      console.error(`Failed to connect to ${relayUrl}:`, error);
    }
  }
  
  if (connections.length === 0) {
    throw new Error("Could not connect to any relays");
  }
  
  return connections;
}

export function getUserRelays(): string[] {
  return userRelays;
}

export function addRelay(relayUrl: string, currentUser: NostrProfile | null): boolean {
  if (userRelays.includes(relayUrl)) {
    return false;
  }
  
  try {
    const ws = new WebSocket(relayUrl);
    ws.onopen = () => {
      userRelays.push(relayUrl);
      localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
      ws.close();
      
      if (currentUser) {
        currentUser.relays = [...userRelays];
        localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
      }
      
      toast({
        title: "Relay added",
        description: `Added ${relayUrl} to your relays`,
      });
    };
    
    ws.onerror = () => {
      toast({
        title: "Invalid relay",
        description: `Could not connect to ${relayUrl}`,
        variant: "destructive",
      });
      ws.close();
    };
    
    return true;
  } catch (error) {
    console.error("Error adding relay:", error);
    return false;
  }
}

export function removeRelay(relayUrl: string, currentUser: NostrProfile | null): boolean {
  if (!userRelays.includes(relayUrl) || relayUrl === DEFAULT_RELAYS[0]) {
    return false;
  }
  
  userRelays = userRelays.filter(r => r !== relayUrl);
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  if (currentUser) {
    currentUser.relays = [...userRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  toast({
    title: "Relay removed",
    description: `Removed ${relayUrl} from your relays`,
  });
  
  return true;
}

export function resetRelays(currentUser: NostrProfile | null): void {
  userRelays = [...DEFAULT_RELAYS];
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  if (currentUser) {
    currentUser.relays = [...userRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  toast({
    title: "Relays reset",
    description: "Your relays have been reset to default",
  });
}

export function loadRelaysFromStorage(): void {
  try {
    const savedRelays = localStorage.getItem(NOSTR_RELAYS_KEY);
    if (savedRelays) {
      userRelays = JSON.parse(savedRelays);
    }
  } catch (error) {
    console.error("Failed to load relays from storage:", error);
  }
}
