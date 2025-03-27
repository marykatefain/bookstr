
import { SimplePool } from "nostr-tools";
import { getUserRelays } from "../relay";

/**
 * Singleton manager for Nostr SimplePool
 * This ensures we reuse the same pool across the application
 * instead of creating new instances for every request
 */
class PoolManager {
  private static instance: PoolManager;
  private pool: SimplePool;
  private lastUsed: number = 0;
  private connectionStatus: Map<string, boolean> = new Map();
  private readonly POOL_TTL = 1000 * 60 * 10; // 10 minutes TTL
  private readonly MAX_IDLE_TIME = 1000 * 60 * 5; // 5 minutes max idle time
  private idleTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.pool = new SimplePool();
    this.lastUsed = Date.now();
    this.startIdleTimer();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }
  
  /**
   * Start the idle timer
   */
  private startIdleTimer(): void {
    this.clearIdleTimer();
    
    this.idleTimer = setTimeout(() => {
      const now = Date.now();
      if (now - this.lastUsed > this.MAX_IDLE_TIME) {
        console.log("Pool idle for too long, closing connections");
        this.closePool();
      } else {
        this.startIdleTimer();
      }
    }, this.MAX_IDLE_TIME);
  }
  
  /**
   * Clear the idle timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
  
  /**
   * Track connection status for a relay
   */
  public setRelayStatus(relay: string, status: boolean): void {
    this.connectionStatus.set(relay, status);
  }
  
  /**
   * Get connection status for a relay
   */
  public getRelayStatus(relay: string): boolean {
    return this.connectionStatus.get(relay) || false;
  }
  
  /**
   * Get the SimplePool instance
   * This will create a new pool if the current one is expired
   */
  public getPool(): SimplePool {
    const now = Date.now();
    
    // Check if we need to refresh the pool due to inactivity
    if (now - this.lastUsed > this.POOL_TTL) {
      console.log("Pool expired due to inactivity, creating new pool");
      this.closePool();
      this.pool = new SimplePool();
    }
    
    this.lastUsed = now;
    this.startIdleTimer();
    return this.pool;
  }
  
  /**
   * Close the pool and create a new one
   */
  public refreshPool(): SimplePool {
    console.log("Refreshing SimplePool instance");
    this.closePool();
    this.pool = new SimplePool();
    this.lastUsed = Date.now();
    this.startIdleTimer();
    return this.pool;
  }
  
  /**
   * Close the current pool
   */
  public closePool(): void {
    this.clearIdleTimer();
    
    try {
      const relays = getUserRelays();
      this.pool.close(relays);
      
      // Reset connection status
      this.connectionStatus.clear();
      
      console.log("Closed SimplePool connections");
    } catch (error) {
      console.error("Error closing pool:", error);
    }
  }
  
  /**
   * Get connection statistics
   */
  public getConnectionStats(): { total: number, connected: number, relays: Record<string, boolean> } {
    const stats = {
      total: this.connectionStatus.size,
      connected: 0,
      relays: {} as Record<string, boolean>
    };
    
    this.connectionStatus.forEach((status, relay) => {
      stats.relays[relay] = status;
      if (status) stats.connected++;
    });
    
    return stats;
  }
}

/**
 * Get the shared SimplePool instance
 */
export function getSharedPool(): SimplePool {
  return PoolManager.getInstance().getPool();
}

/**
 * Force refresh the shared pool
 */
export function refreshSharedPool(): SimplePool {
  return PoolManager.getInstance().refreshPool();
}

/**
 * Close all connections in the shared pool
 */
export function closeSharedPool(): void {
  PoolManager.getInstance().closePool();
}

/**
 * Set connection status for a relay
 */
export function setRelayStatus(relay: string, status: boolean): void {
  PoolManager.getInstance().setRelayStatus(relay, status);
}

/**
 * Get connection status for all relays
 */
export function getConnectionStats(): { total: number, connected: number, relays: Record<string, boolean> } {
  return PoolManager.getInstance().getConnectionStats();
}
