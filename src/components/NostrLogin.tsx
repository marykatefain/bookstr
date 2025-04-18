
import { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithNostr, getCurrentUser, initNostr } from "@/lib/nostr";
import { setupExternalLoginDetection } from "@/lib/nostr/externalLogin";
import { useToast } from "@/hooks/use-toast";
import { connectToRelays, loadRelaysFromStorage } from "@/lib/nostr/relay";

interface NostrLoginProps {
  onLoginComplete?: () => void;
}

export const NostrLogin = ({ onLoginComplete }: NostrLoginProps) => {
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Initialize Nostr on component mount, but only once
  useEffect(() => {
    if (connectionAttempted) return;
    
    const initializeNostr = async () => {
      try {
        setConnectionAttempted(true);
        loadRelaysFromStorage();
        const user = await initNostr();
        console.info("Nostr initialized");
        
        if (user) {
          // Establish relay connections upon successful login
          // but don't force refresh connections if they're already established
          try {
            await connectToRelays(undefined, false);
            console.info("Relay connections established");
            
            // Call onLoginComplete when user is already logged in from initialization
            onLoginComplete?.();
          } catch (error) {
            console.error("Failed to connect to relays:", error);
          }
        }
      } catch (error) {
        console.error("Nostr initialization error:", error);
      }
    };
    
    initializeNostr();
  }, [connectionAttempted, onLoginComplete]);

  // Set up external login detection (when user logs in through extension outside our app)
  useEffect(() => {
    // Only set up detection if the user isn't already logged in
    if (getCurrentUser()) return;
    
    // This will detect if a user logs in through the extension directly
    const cleanup = setupExternalLoginDetection(() => {
      onLoginComplete?.();
    });
    
    return cleanup;
  }, [onLoginComplete]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // The nostr-login package will handle the UI and connection
      // We just need to call window.nostr.getPublicKey()
      const user = await loginWithNostr();
      if (user) {
        // Establish relay connections upon successful login
        try {
          // Use a higher timeout for initial connection
          await connectToRelays();
          console.info("Relay connections established after login");
        } catch (connError) {
          console.error("Failed to connect to relays after login:", connError);
          toast({
            title: "Relay connection issue",
            description: "Connected to Nostr but couldn't establish relay connections. Some features may not work.",
            variant: "destructive"
          });
        }
        
        toast({
          title: "Login successful",
          description: `Welcome to Bookstr, ${user.name || "Nostr User"}!`
        });
        onLoginComplete?.();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Could not connect to Nostr. Make sure you have a Nostr extension installed.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (getCurrentUser()) {
    return null;
  }

  return (
    <Button 
      onClick={handleLogin} 
      className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
      size="lg"
      disabled={isLoggingIn}
    >
      <LogIn className="h-5 w-5 mr-2" />
      {isLoggingIn ? "Connecting..." : "Sign in with Nostr"}
    </Button>
  );
};
