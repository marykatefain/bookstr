
import { DEFAULT_RELAYS } from './constants';

// Global state for relay connections
export let userRelays = [...DEFAULT_RELAYS];
export let activeConnections: WebSocket[] = [];
export let connectionAttemptInProgress = false;
export let connectionPromise: Promise<WebSocket[]> | null = null;
export let lastConnectionAttempt = 0;

// Update user relays
export function setUserRelays(relays: string[]): void {
  userRelays = [...relays];
}

// Update active connections
export function setActiveConnections(connections: WebSocket[]): void {
  activeConnections = [...connections];
}

// Update connection attempt state
export function setConnectionAttemptInProgress(inProgress: boolean): void {
  connectionAttemptInProgress = inProgress;
}

// Update connection promise
export function setConnectionPromise(promise: Promise<WebSocket[]> | null): void {
  connectionPromise = promise;
}

// Update last connection attempt timestamp
export function setLastConnectionAttempt(timestamp: number): void {
  lastConnectionAttempt = timestamp;
}
