
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
  private readonly POOL_TTL = 1000 * 60 * 10; // 10 minutes TTL
  
  private constructor() {
    this.pool = new SimplePool();
    this.lastUsed = Date.now();
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
    return this.pool;
  }
  
  /**
   * Close the current pool
   */
  public closePool(): void {
    try {
      const relays = getUserRelays();
      this.pool.close(relays);
      console.log("Closed SimplePool connections");
    } catch (error) {
      console.error("Error closing pool:", error);
    }
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
