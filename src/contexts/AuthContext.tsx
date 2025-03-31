import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isLoggedIn, NostrProfile } from '@/lib/nostr';

interface AuthContextType {
  isAuthenticated: boolean;
  user: NostrProfile | null;
  refreshAuth: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isLoggedIn());
  const [user, setUser] = useState<NostrProfile | null>(getCurrentUser());

  // Function to refresh auth state
  const refreshAuth = () => {
    const authenticated = isLoggedIn();
    setIsAuthenticated(authenticated);
    setUser(authenticated ? getCurrentUser() : null);
  };

  // Initial check on mount
  useEffect(() => {
    refreshAuth();

    // Set up a message listener for cross-component communication
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data === 'auth-state-changed') {
        console.log('Auth state change detected via message');
        refreshAuth();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    
    // Add a fallback check every 3 seconds just in case
    // This helps catch external events like NIP-07 extension actions
    const interval = setInterval(refreshAuth, 3000);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility to broadcast auth state changes to all components
export function notifyAuthChange() {
  window.postMessage('auth-state-changed', window.location.origin);
}