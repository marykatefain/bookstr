
import React, { useState } from "react";
import { Users, Globe } from "lucide-react";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { Card } from "@/components/ui/card";
import { SocialFeed } from "@/components/SocialFeed";
import { Button } from "@/components/ui/button";

export function SocialSection() {
  const [feedType, setFeedType] = useState<"followers" | "global">("global");

  if (!isLoggedIn()) {
    return (
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
          <Users className="mr-2 h-5 w-5" />
          #Bookstr Community on Nostr
        </h2>
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Connect with other readers</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to see what books your friends are reading and share your own reading journey.
          </p>
          <Button 
            variant="default" 
            className="bg-bookverse-accent hover:bg-bookverse-accent/90 text-white"
            asChild
          >
            <a href="/library">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
          <Users className="mr-2 h-5 w-5" />
          #Bookstr Community on Nostr
        </h2>
        <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            onClick={() => setFeedType("followers")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              feedType === "followers" 
                ? "bg-background text-foreground shadow-sm" 
                : ""
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Following</span>
          </button>
          <button
            onClick={() => setFeedType("global")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              feedType === "global" 
                ? "bg-background text-foreground shadow-sm" 
                : ""
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            <span>Global</span>
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <CreatePostBox />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <SocialFeed type={feedType} useMockData={false} />
      </div>
    </div>
  );
}
