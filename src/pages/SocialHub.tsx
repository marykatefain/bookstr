
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { UserFinder } from "@/components/UserFinder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, Users, Zap, Globe, UserPlus } from "lucide-react";

export default function SocialHub() {
  const [activeTab, setActiveTab] = useState("activity");
  const [activitySubTab, setActivitySubTab] = useState("followers");

  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-serif font-bold text-bookverse-ink">Social Hub</h1>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "activity" ? "default" : "outline"} 
              onClick={() => setActiveTab("activity")}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </Button>
            <Button 
              variant={activeTab === "find-friends" ? "default" : "outline"} 
              onClick={() => setActiveTab("find-friends")}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Find Friends</span>
            </Button>
          </div>
        </div>

        <TabsContent value="activity" className={activeTab !== "activity" ? "hidden" : ""}>
          <Tabs value={activitySubTab} onValueChange={setActivitySubTab} className="w-full">
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

        <TabsContent value="find-friends" className={activeTab !== "find-friends" ? "hidden" : ""}>
          <UserFinder />
        </TabsContent>
      </div>
    </Layout>
  );
}
