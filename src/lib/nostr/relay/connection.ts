
import { toast } from "@/hooks/use-toast";
import { 
  CONNECTION_TIMEOUT, 
  CONNECTION_COOLDOWN 
} from './constants';
import { 
  activeConnections, 
  connectionAttemptInProgress, 
  connectionPromise, 
  lastConnectionAttempt, 
  setActiveConnections, 
  setConnectionAttemptInProgress, 
  setConnectionPromise, 
  setLastConnectionAttempt, 
  userRelays 
} from './state';

/**
 * Connect to relays with cooldown and timeout management
 */
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
  
  setConnectionAttemptInProgress(true);
  setLastConnectionAttempt(now);
  
  const promise = new Promise<WebSocket[]>(async (resolve, reject) => {
    try {
      const openConnections = activeConnections.filter(
        conn => conn.readyState === WebSocket.OPEN
      );
      
      if (openConnections.length > 0) {
        console.log(`Using ${openConnections.length} existing open connections`);
        setConnectionAttemptInProgress(false);
        setConnectionPromise(null);
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
        setActiveConnections([...connections]);
        console.log(`Successfully connected to ${connections.length}/${relays.length} relays`);
        resolve(connections);
      }
    } catch (error) {
      console.error("Error in connectToRelays:", error);
      reject(error);
    } finally {
      setConnectionAttemptInProgress(false);
      setConnectionPromise(null);
    }
  });
  
  setConnectionPromise(promise);
  return promise;
}

/**
 * Connect to a single relay with timeout handling
 */
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
        setActiveConnections(activeConnections.filter(conn => conn !== socket));
      };
    } catch (error) {
      console.error(`Exception when connecting to ${relayUrl}:`, error);
      reject(error);
    }
  });
}

/**
 * Get all active and open connections
 */
export function getActiveConnections(): WebSocket[] {
  return activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
}

/**
 * Close all active connections
 */
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
  setActiveConnections([]);
}

/**
 * Ensure we have open connections, reconnecting if needed
 */
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

/**
 * Check if we have at least one healthy connection
 */
export function checkConnectionHealth(): boolean {
  const openConnections = activeConnections.filter(
    conn => conn.readyState === WebSocket.OPEN
  );
  
  return openConnections.length > 0;
}

/**
 * Get the current connection status
 */
export function getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
  if (connectionAttemptInProgress) {
    return 'connecting';
  }
  
  const openConnections = activeConnections.filter(
    conn => conn.readyState === WebSocket.OPEN
  );
  
  return openConnections.length > 0 ? 'connected' : 'disconnected';
}
