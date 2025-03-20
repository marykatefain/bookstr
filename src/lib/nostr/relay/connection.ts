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
const CACHE_TTL = 120000; // 2 minutes cache time-to-live

// Rate limiting tracking
const relayAttempts = new Map<string, {attempts: number, lastAttempt: number}>();
const MAX_ATTEMPTS_PER_MINUTE = 5;
const RATE_LIMIT_RESET = 60000; // 1 minute

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
      
      // Implement relay selection strategy - prioritize relays without rate limit issues
      const prioritizedRelays = prioritizeHealthyRelays(relays);
      
      // Limit the number of simultaneous connection attempts
      // Connect to a maximum of 3 relays to reduce connection overhead
      const maxRelaysToConnect = Math.min(3, prioritizedRelays.length);
      const relaysToConnect = prioritizedRelays.slice(0, maxRelaysToConnect);
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
          // Track failed attempt for this relay
          trackRelayAttempt(relaysToConnect[index], false);
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
 * Prioritize healthy relays that aren't experiencing rate limits
 */
function prioritizeHealthyRelays(relays: string[]): string[] {
  const now = Date.now();
  
  // Sort relays based on their recent success/failure and rate limiting
  return [...relays].sort((a, b) => {
    const aAttempts = relayAttempts.get(a);
    const bAttempts = relayAttempts.get(b);
    
    // If we have no data, prioritize this relay
    if (!aAttempts) return -1;
    if (!bAttempts) return 1;
    
    // Check if relay is in rate limit cooldown
    const aInRateLimit = isRelayRateLimited(a);
    const bInRateLimit = isRelayRateLimited(b);
    
    if (aInRateLimit && !bInRateLimit) return 1;
    if (!aInRateLimit && bInRateLimit) return -1;
    
    // Otherwise sort by fewest recent attempts
    return aAttempts.attempts - bAttempts.attempts;
  });
}

/**
 * Track connection attempts for rate limiting
 */
function trackRelayAttempt(relayUrl: string, success: boolean): void {
  const now = Date.now();
  const relayData = relayAttempts.get(relayUrl) || { attempts: 0, lastAttempt: 0 };
  
  // Reset counter if it's been a while
  if (now - relayData.lastAttempt > RATE_LIMIT_RESET) {
    relayData.attempts = 0;
  }
  
  // Increment attempt counter
  relayData.attempts++;
  relayData.lastAttempt = now;
  
  relayAttempts.set(relayUrl, relayData);
  
  // If rate limited, log it
  if (relayData.attempts > MAX_ATTEMPTS_PER_MINUTE) {
    console.warn(`Relay ${relayUrl} appears to be rate limiting (${relayData.attempts} attempts)`);
  }
}

/**
 * Check if a relay is likely rate limiting us
 */
function isRelayRateLimited(relayUrl: string): boolean {
  const now = Date.now();
  const relayData = relayAttempts.get(relayUrl);
  
  if (!relayData) return false;
  
  // If it's been a while, relay is no longer rate limited
  if (now - relayData.lastAttempt > RATE_LIMIT_RESET) {
    return false;
  }
  
  return relayData.attempts > MAX_ATTEMPTS_PER_MINUTE;
}

/**
 * Connect to a single relay with timeout handling
 */
async function connectToRelay(relayUrl: string): Promise<WebSocket | null> {
  // Check if we're likely being rate limited by this relay
  if (isRelayRateLimited(relayUrl)) {
    console.log(`Skipping connection to ${relayUrl} due to probable rate limiting`);
    return Promise.reject(new Error(`Rate limiting detected for ${relayUrl}`));
  }
  
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
        // Track successful connection
        trackRelayAttempt(relayUrl, true);
        resolve(socket);
      };
      
      socket.onerror = (event) => {
        console.error(`Error connecting to ${relayUrl}:`, event);
        clearTimeout(timeout);
        // Track failed connection
        trackRelayAttempt(relayUrl, false);
        reject(new Error(`Connection error for ${relayUrl}`));
      };
      
      socket.onclose = (event) => {
        console.log(`Connection closed for ${relayUrl}: code=${event.code}, reason=${event.reason}`);
        
        // Check if this was a rate limit closure
        if (event.code === 1008 && event.reason?.toLowerCase().includes('rate limit')) {
          console.warn(`Rate limit detected for ${relayUrl}: ${event.reason}`);
          // Mark this relay as rate limited with a high attempt count
          relayAttempts.set(relayUrl, {
            attempts: MAX_ATTEMPTS_PER_MINUTE + 5,
            lastAttempt: Date.now()
          });
        }
        
        setActiveConnections(activeConnections.filter(conn => conn !== socket));
      };
    } catch (error) {
      console.error(`Exception when connecting to ${relayUrl}:`, error);
      // Track failed connection
      trackRelayAttempt(relayUrl, false);
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
