
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NostrLogin } from "@/components/NostrLogin";

interface GuestFeedCardProps {
  onLoginSuccess?: () => void;
}

export function GuestFeedCard({ onLoginSuccess }: GuestFeedCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-2">Connect with other readers</h3>
      <p className="text-muted-foreground mb-4">
        Sign in to share your own reading journey and interact with other book lovers.
      </p>
      <NostrLogin onLoginComplete={onLoginSuccess} />
    </Card>
  );
}
