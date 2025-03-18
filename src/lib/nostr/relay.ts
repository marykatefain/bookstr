import { toast } from "@/hooks/use-toast";
import { NostrProfile } from "./types";

export const DEFAULT_RELAYS = ["wss://ditto.pub/relay"];
let userRelays = [...DEFAULT_RELAYS];
let activeConnections: WebSocket[] = [];
let connectionAttemptInProgress = false;
let connectionPromise: Promise<WebSocket[]> | null = null;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN = 2000; // 2 seconds cooldown between connection attempts

const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';
const NOSTR_USER_KEY = 'bookverse_nostr_user';

export async function connectToRelays(relays: string[] = userRelays): Promise<WebSocket[]> {
  const now = Date.now();
  
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    const openConnections = activeConnections.filter(
      conn => conn.readyState === WebSocket.OPEN
    );
    
    if (openConnections.length > 0) {
      console.log(`Using ${openConnections.length} existing connections due to connection cooldown`);
      return openConnections;
    }
  }
  
  if (connectionPromise) {
    console.log("Connection attempt already in progress, reusing promise");
    return connectionPromise;
  }
  
  connectionAttemptInProgress = true;
  lastConnectionAttempt = now;
  
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      const openConnections = activeConnections.filter(
        conn => conn.readyState === WebSocket.OPEN
      );
      
      if (openConnections.length > 0) {
        console.log(`Using ${openConnections.length} existing open connections`);
        connectionAttemptInProgress = false;
        connectionPromise = null;
        return resolve(openConnections);
      }
      
      closeActiveConnections();
      
      const connections: WebSocket[] = [];
      console.log(`Attempting to connect to relays: ${relays.join(', ')}`);
      
      for (const relayUrl of relays) {
        try {
          console.log(`Connecting to relay: ${relayUrl}`);
          const socket = new WebSocket(relayUrl);
          
          await new Promise((socketResolve, socketReject) => {
            const timeout = setTimeout(() => {
              socketReject(new Error(`Connection timeout for ${relayUrl}`));
            }, 7000);
            
            socket.onopen = () => {
              console.log(`Successfully connected to ${relayUrl}`);
              clearTimeout(timeout);
              socketResolve(socket);
            };
            
            socket.onerror = (event) => {
              console.error(`Error connecting to ${relayUrl}:`, event);
              clearTimeout(timeout);
              socketReject(new Error(`Connection error for ${relayUrl}`));
            };
            
            socket.onclose = (event) => {
              console.log(`Connection closed for ${relayUrl}: code=${event.code}, reason=${event.reason}`);
              activeConnections = activeConnections.filter(conn => conn !== socket);
            };
          });
          
          connections.push(socket);
        } catch (error) {
          console.error(`Failed to connect to ${relayUrl}:`, error);
        }
      }
      
      if (connections.length === 0) {
        const errorMsg = "Could not connect to any relays";
        console.error(errorMsg);
        reject(new Error(errorMsg));
      } else {
        activeConnections = [...connections];
        console.log(`Successfully connected to ${connections.length} relays`);
        resolve(connections);
      }
    } catch (error) {
      console.error("Error in connectToRelays:", error);
      reject(error);
    } finally {
      connectionAttemptInProgress = false;
      connectionPromise = null;
    }
  });
  
  return connectionPromise;
}

export function getActiveConnections(): WebSocket[] {
  return activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
}

export function closeActiveConnections(): void {
  console.log(`Closing ${activeConnections.length} active connections`);
  
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

export async function ensureConnections(): Promise<WebSocket[]> {
  const openConnections = activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
  
  if (openConnections.length > 0) {
    console.log(`Using ${openConnections.length} existing open connections`);
    return openConnections;
  } else {
    console.log("No open connections found, reconnecting to relays");
    return await connectToRelays();
  }
}
