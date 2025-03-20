
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FeedLoginStateProps {
  feedType: "followers" | "global";
}

export function FeedLoginState({ feedType }: FeedLoginStateProps) {
  if (feedType === "global") {
    return null; // Global feed doesn't require login
  }
  
  return (
    <Card className="text-center p-6">
      <p className="text-muted-foreground mb-4">
        Sign in to see updates from people you follow
      </p>
      <Button 
        variant="default" 
        className="bg-bookverse-accent hover:bg-bookverse-accent/90 text-white"
        asChild
      >
        <Link to="/library">Sign In</Link>
      </Button>
    </Card>
  );
}
