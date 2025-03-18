
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { UserFinder } from "@/components/UserFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe } from "lucide-react";

export default function SocialHub() {
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
          
          {/* Activity Feed Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-semibold text-bookverse-ink">Activity Feed</h2>
            <Tabs defaultValue="followers" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="followers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Global</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="followers">
                <SocialFeed type="followers" />
              </TabsContent>
              
              <TabsContent value="global">
                <SocialFeed type="global" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
