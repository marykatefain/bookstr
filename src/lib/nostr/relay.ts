import { toast } from "@/hooks/use-toast";
import { NostrProfile } from "./types";

export const DEFAULT_RELAYS = ["wss://ditto.pub/relay", "wss://relay.nostr.band", "wss://relay.damus.io"];
let userRelays = [...DEFAULT_RELAYS];
let activeConnections: WebSocket[] = [];
let connectionAttemptInProgress = false;
let connectionPromise: Promise<WebSocket[]> | null = null;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN = 2000; // 2 seconds cooldown between connection attempts
const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout for connections

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
      
      // Try connecting to all relays in parallel
      const connectionPromises = relays.map(relayUrl => connectToRelay(relayUrl));
      
      // Wait for all connection attempts and filter out the failed ones
      const results = await Promise.allSettled(connectionPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          connections.push(result.value);
        } else if (result.status === 'rejected') {
          console.error(`Connection to ${relays[index]} failed:`, result.reason);
        }
      });
      
      if (connections.length === 0) {
        const errorMsg = "Could not connect to any relays";
        console.error(errorMsg);
        reject(new Error(errorMsg));
      } else {
        activeConnections = [...connections];
        console.log(`Successfully connected to ${connections.length}/${relays.length} relays`);
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

async function connectToRelay(relayUrl: string): Promise<WebSocket | null> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Connecting to relay: ${relayUrl}`);
      const socket = new WebSocket(relayUrl);
      
      const timeout = setTimeout(() => {
        console.error(`Connection timeout for ${relayUrl}`);
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          reject(new Error(`Connection timeout for ${relayUrl}`));
        }
      }, CONNECTION_TIMEOUT);
      
      socket.onopen = () => {
        console.log(`Successfully connected to ${relayUrl}`);
        clearTimeout(timeout);
        resolve(socket);
      };
      
      socket.onerror = (event) => {
        console.error(`Error connecting to ${relayUrl}:`, event);
        clearTimeout(timeout);
        reject(new Error(`Connection error for ${relayUrl}`));
      };
      
      socket.onclose = (event) => {
        console.log(`Connection closed for ${relayUrl}: code=${event.code}, reason=${event.reason}`);
        activeConnections = activeConnections.filter(conn => conn !== socket);
      };
    } catch (error) {
      console.error(`Exception when connecting to ${relayUrl}:`, error);
      reject(error);
    }
  });
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
  loadRelaysFromStorage();
  return [...userRelays]; // Return a copy to avoid direct mutation
}

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
        userRelays.push(relayUrl);
        localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
        
        // Update user profile if available
        if (currentUser) {
          currentUser.relays = [...userRelays];
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

export function resetRelays(currentUser: NostrProfile | null): void {
  userRelays = [...DEFAULT_RELAYS];
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  if (currentUser) {
    currentUser.relays = [...userRelays];
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

export function loadRelaysFromStorage(): void {
  try {
    const savedRelays = localStorage.getItem(NOSTR_RELAYS_KEY);
    if (savedRelays) {
      const parsedRelays = JSON.parse(savedRelays);
      if (Array.isArray(parsedRelays) && parsedRelays.length > 0) {
        userRelays = parsedRelays;
      }
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

export function checkConnectionHealth(): boolean {
  const openConnections = activeConnections.filter(
    conn => conn.readyState === WebSocket.OPEN
  );
  
  return openConnections.length > 0;
}

export function getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
  if (connectionAttemptInProgress) {
    return 'connecting';
  }
  
  const openConnections = activeConnections.filter(
    conn => conn.readyState === WebSocket.OPEN
  );
  
  return openConnections.length > 0 ? 'connected' : 'disconnected';
}
