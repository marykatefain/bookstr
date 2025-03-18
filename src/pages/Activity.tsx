
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSocialFeed, isLoggedIn } from "@/lib/nostr";
import { SocialActivity } from "@/lib/nostr/types";
import { Users, Globe } from "lucide-react";
import { mockFollowersActivities, mockGlobalActivities } from "@/lib/nostr/mockData";

export default function Activity() {
  const [followersActivity, setFollowersActivity] = useState<SocialActivity[]>([]);
  const [globalActivity, setGlobalActivity] = useState<SocialActivity[]>([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(true); // State to control mock data usage

  useEffect(() => {
    // Function to load real data
    const loadRealData = async () => {
      const loadFollowersActivity = async () => {
        if (!isLoggedIn()) {
          setFollowersLoading(false);
          return;
        }
        
        try {
          const feed = await fetchSocialFeed(20);
          setFollowersActivity(feed);
        } catch (error) {
          console.error("Error loading followers feed:", error);
        } finally {
          setFollowersLoading(false);
        }
      };

      const loadGlobalActivity = async () => {
        try {
          // For now, we'll use the same endpoint but in a real implementation
          // this would fetch from a global activity endpoint
          const feed = await fetchSocialFeed(20);
          setGlobalActivity(feed);
        } catch (error) {
          console.error("Error loading global feed:", error);
        } finally {
          setGlobalLoading(false);
        }
      };

      if (!useMockData) {
        loadFollowersActivity();
        loadGlobalActivity();
      }
    };

    // Function to load mock data
    const loadMockData = () => {
      setTimeout(() => {
        setFollowersActivity(mockFollowersActivities);
        setFollowersLoading(false);
        
        setGlobalActivity(mockGlobalActivities);
        setGlobalLoading(false);
      }, 800); // Artificial delay to simulate loading
    };

    if (useMockData) {
      loadMockData();
    } else {
      loadRealData();
    }
  }, [useMockData]);

  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif font-bold text-bookverse-ink">Activity Feed</h1>
          <button 
            onClick={() => setUseMockData(!useMockData)}
            className="text-sm px-3 py-1 rounded bg-bookverse-paper border border-bookverse-ink/20 hover:bg-bookverse-ink/10"
          >
            {useMockData ? "Switch to Real Data" : "Switch to Mock Data"}
          </button>
        </div>
        
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Followers</span>
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Global</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers">
            {followersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[150px] w-full" />
              </div>
            ) : followersActivity.length > 0 ? (
              <div className="space-y-4">
                <SocialFeed activities={followersActivity} />
              </div>
            ) : (
              <Card className="text-center p-6">
                <p className="text-muted-foreground mb-4">
                  No activity yet from people you follow
                </p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="global">
            {globalLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[150px] w-full" />
              </div>
            ) : globalActivity.length > 0 ? (
              <div className="space-y-4">
                <SocialFeed activities={globalActivity} />
              </div>
            ) : (
              <Card className="text-center p-6">
                <p className="text-muted-foreground mb-4">
                  No global activity available at the moment
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
