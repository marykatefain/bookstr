
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { UserFinder } from "@/components/UserFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Globe, UserPlus } from "lucide-react";

export default function SocialHub() {
  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-4xl">
        <h1 className="text-3xl font-serif font-bold text-bookverse-ink mb-6">Social Hub</h1>
        
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="find-friends" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Find Friends</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
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
          </TabsContent>
          
          <TabsContent value="find-friends">
            <UserFinder />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
