
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GuestFeedCard() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-2">Connect with other readers</h3>
      <p className="text-muted-foreground mb-4">
        Sign in to share your own reading journey and interact with other book lovers.
      </p>
      <Button 
        variant="default" 
        className="bg-bookverse-accent hover:bg-bookverse-accent/90 text-white"
        asChild
      >
        <a href="/library">Sign In</a>
      </Button>
    </Card>
  );
}
