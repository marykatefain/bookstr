
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { UserFinder } from "@/components/UserFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe } from "lucide-react";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { isLoggedIn } from "@/lib/nostr";

export default function SocialHub() {
  const [feedType, setFeedType] = useState<"followers" | "global">("followers");

  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-4xl">
        <h1 className="text-3xl font-serif font-bold text-bookverse-ink mb-6">Social Hub</h1>
        
        <div className="space-y-10">
          {/* Find Friends Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-semibold text-bookverse-ink">Find Friends</h2>
            <UserFinder hideRecentActivity={true} />
          </div>
          
          {/* Post Creation Section */}
          {isLoggedIn() && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-bookverse-ink">Share with the Community</h2>
              <CreatePostBox />
            </div>
          )}
          
          {/* Activity Feed Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-semibold text-bookverse-ink">Activity Feed</h2>
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
            
            <SocialFeed type={feedType} useMockData={false} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
