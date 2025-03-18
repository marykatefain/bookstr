import { toast } from "@/hooks/use-toast";
import { NostrProfile } from "./types";

export const DEFAULT_RELAYS = ["wss://ditto.pub/relay"];
let userRelays = [...DEFAULT_RELAYS];
let activeConnections: WebSocket[] = [];

const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';
const NOSTR_USER_KEY = 'bookverse_nostr_user';

export async function connectToRelays(relays: string[] = userRelays): Promise<WebSocket[]> {
  // Close any existing connections to prevent resource leaks
  closeActiveConnections();
  
  const connections: WebSocket[] = [];
  console.log(`Attempting to connect to relays: ${relays.join(', ')}`);
  
  for (const relayUrl of relays) {
    try {
      console.log(`Connecting to relay: ${relayUrl}`);
      const socket = new WebSocket(relayUrl);
      
      await new Promise((resolve, reject) => {
        socket.onopen = () => {
          console.log(`Successfully connected to ${relayUrl}`);
          resolve(socket);
        };
        
        socket.onerror = (event) => {
          console.error(`Error connecting to ${relayUrl}:`, event);
          reject(new Error(`Connection error for ${relayUrl}`));
        };
        
        socket.onclose = (event) => {
          console.log(`Connection closed for ${relayUrl}: code=${event.code}, reason=${event.reason}`);
        };
        
        setTimeout(() => reject(new Error(`Connection timeout for ${relayUrl}`)), 5000);
      });
      
      connections.push(socket);
    } catch (error) {
      console.error(`Failed to connect to ${relayUrl}:`, error);
    }
  }
  
  if (connections.length === 0) {
    const errorMsg = "Could not connect to any relays";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Store active connections for later use or cleanup
  activeConnections = [...connections];
  console.log(`Successfully connected to ${connections.length} relays`);
  
  return connections;
}

export function getActiveConnections(): WebSocket[] {
  return activeConnections;
}

export function closeActiveConnections(): void {
  for (const connection of activeConnections) {
    if (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING) {
      try {
        connection.close();
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
    }
  }
  activeConnections = [];
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

export function ensureConnections(): Promise<WebSocket[]> {
  // If we have active connections that are still open, use them
  const openConnections = activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
  
  if (openConnections.length > 0) {
    console.log(`Using ${openConnections.length} existing open connections`);
    return Promise.resolve(openConnections);
  } else {
    console.log("No open connections found, reconnecting to relays");
    return connectToRelays();
  }
}
