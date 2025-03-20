
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, X, RotateCcw } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  DEFAULT_RELAYS, 
  getUserRelays, 
  addRelay, 
  removeRelay, 
  resetRelays,
  getCurrentUser
} from "@/lib/nostr";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function RelaySettings() {
  const { toast } = useToast();
  const [relayUrl, setRelayUrl] = useState("");
  const [relays, setRelays] = useState<string[]>([]);
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    // Load relays when component mounts
    setRelays(getUserRelays());
  }, []);

  const handleAddRelay = () => {
    // Basic validation
    if (!relayUrl || !relayUrl.startsWith("wss://")) {
      toast({
        title: "Invalid relay URL",
        description: "Relay URL must start with wss://",
        variant: "destructive",
      });
      return;
    }

    if (addRelay(relayUrl, currentUser)) {
      // We'll update the local state after the relay is successfully added
      setTimeout(() => {
        setRelays(getUserRelays());
        setRelayUrl("");
      }, 500); // Short delay to ensure relay is properly added
    }
  };

  const handleRemoveRelay = (relay: string) => {
    if (removeRelay(relay, currentUser)) {
      // Small delay to ensure UI is updated after relay is removed
      setTimeout(() => {
        setRelays(getUserRelays());
      }, 500);
    } else if (relay === DEFAULT_RELAYS[0]) {
      toast({
        title: "Cannot remove default relay",
        description: "The default relay cannot be removed",
        variant: "destructive",
      });
    }
  };

  const handleResetRelays = () => {
    resetRelays(currentUser);
    setTimeout(() => {
      setRelays(getUserRelays());
    }, 500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nostr Relays</CardTitle>
        <CardDescription>
          Manage the Nostr relays used to fetch and publish your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {relays.map((relay) => (
            <Badge
              key={relay}
              variant={relay === DEFAULT_RELAYS[0] ? "secondary" : "default"}
              className="flex items-center gap-1 px-3 py-1.5"
            >
              {relay}
              {relay !== DEFAULT_RELAYS[0] && (
                <button
                  onClick={() => handleRemoveRelay(relay)}
                  className="ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="wss://relay.example.com"
            value={relayUrl}
            onChange={(e) => setRelayUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddRelay} size="sm">
            <PlusCircle className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetRelays}
          className="flex items-center ml-auto"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to Default
        </Button>
      </CardFooter>
    </Card>
  );
}
