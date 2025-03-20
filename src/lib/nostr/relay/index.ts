
// Export core functionality
export { connectToRelays, getActiveConnections, closeActiveConnections, ensureConnections, checkConnectionHealth, getConnectionStatus } from './connection';
export { getUserRelays, addRelay, removeRelay, resetRelays, loadRelaysFromStorage } from './storage';
export { DEFAULT_RELAYS } from './constants';
