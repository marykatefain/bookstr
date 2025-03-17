
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithNostr, getCurrentUser } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

interface NostrLoginProps {
  onLoginComplete?: () => void;
}

export const NostrLogin = ({ onLoginComplete }: NostrLoginProps) => {
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithNostr();
      if (user) {
        toast({
          title: "Login successful",
          description: "Welcome to BookVerse!"
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
      className="w-full" 
      disabled={isLoggingIn}
    >
      <LogIn className="h-4 w-4 mr-2" />
      {isLoggingIn ? "Connecting..." : "Sign in with Nostr"}
    </Button>
  );
};
