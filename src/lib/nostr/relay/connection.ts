
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

// Cache to store recent query results to avoid duplicate requests
const queryCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 30000; // 30 seconds cache time-to-live

/**
 * Connect to relays with cooldown and timeout management
 */
export async function connectToRelays(relays: string[] = userRelays, forceReconnect: boolean = false): Promise<WebSocket[]> {
  console.log("Attempting to connect to relays", { relays, forceReconnect });
  const now = Date.now();
  
  // If forceReconnect is true, skip cooldown check
  if (!forceReconnect && now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    const openConnections = activeConnections.filter(
      conn => conn.readyState === WebSocket.OPEN
    );
    
    if (openConnections.length > 0) {
      console.log(`Using ${openConnections.length} existing connections due to connection cooldown`);
      return openConnections;
    }
  }
  
  if (connectionPromise && !forceReconnect) {
    console.log("Connection attempt already in progress, reusing promise");
    return connectionPromise;
  }
  
  setConnectionAttemptInProgress(true);
  setLastConnectionAttempt(now);
  
  const promise = new Promise<WebSocket[]>(async (resolve, reject) => {
    try {
      // If forceReconnect is true, close existing connections first
      if (forceReconnect) {
        closeActiveConnections();
      } else {
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
      }
      
      // Limit the number of simultaneous connection attempts
      // Connect to a maximum of 3 relays to reduce connection overhead
      const maxRelaysToConnect = Math.min(3, relays.length);
      const relaysToConnect = relays.slice(0, maxRelaysToConnect);
      console.log(`Limiting connection attempts to ${maxRelaysToConnect} relays`);
      
      const connections: WebSocket[] = [];
      console.log(`Attempting to connect to relays: ${relaysToConnect.join(', ')}`);
      
      // Try connecting to limited relays in parallel
      const connectionPromises = relaysToConnect.map(relayUrl => connectToRelay(relayUrl));
      
      // Wait for all connection attempts and filter out the failed ones
      const results = await Promise.allSettled(connectionPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          connections.push(result.value);
        } else if (result.status === 'rejected') {
          console.error(`Connection to ${relaysToConnect[index]} failed:`, result.reason);
        }
      });
      
      if (connections.length === 0) {
        const errorMsg = "Could not connect to any relays";
        console.error(errorMsg);
        reject(new Error(errorMsg));
      } else {
        setActiveConnections([...connections]);
        console.log(`Successfully connected to ${connections.length}/${relaysToConnect.length} relays`);
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
 * Cache query results to reduce duplicate requests
 */
export function cacheQueryResult(cacheKey: string, data: any): void {
  queryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cached query result if available and not expired
 */
export function getCachedQueryResult(cacheKey: string): any | null {
  const cached = queryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`Using cached result for ${cacheKey}`);
    return cached.data;
  }
  return null;
}

/**
 * Generate a cache key from filter object
 */
export function generateCacheKey(filter: any): string {
  return JSON.stringify(filter);
}

/**
 * Clear expired cache entries
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
}

// Run cache cleanup periodically
setInterval(cleanupCache, 60000); // Every minute

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
export async function ensureConnections(forceReconnect: boolean = false): Promise<WebSocket[]> {
  const openConnections = activeConnections.filter(conn => conn.readyState === WebSocket.OPEN);
  
  if (openConnections.length > 0 && !forceReconnect) {
    console.log(`Using ${openConnections.length} existing open connections`);
    return openConnections;
  } else {
    console.log("No open connections found or forced reconnect requested, reconnecting to relays");
    return await connectToRelays(userRelays, forceReconnect);
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
