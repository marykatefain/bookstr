
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCards } from "@/components/profile/StatsCards";
import { LibraryLoginState } from "@/components/library/LibraryLoginState";
import { RelaySettingsPanel } from "@/components/library/RelaySettingsPanel";
import { LibraryTabs } from "@/components/library/LibraryTabs";
import { useLibraryData } from "@/hooks/use-library-data";
import { isLoggedIn, fetchProfileData } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState("books");
  const [showRelaySettings, setShowRelaySettings] = useState(false);
  const { toast } = useToast();
  const { 
    user, 
    books, 
    posts, 
    reviews,
    booksLoading, 
    postsLoading, 
    reviewsLoading,
    refetchBooks,
    setUser 
  } = useLibraryData();

  const toggleRelaySettings = () => {
    setShowRelaySettings(!showRelaySettings);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const refreshUserProfile = async () => {
    if (user?.pubkey) {
      try {
        const profileData = await fetchProfileData(user.pubkey);
        if (profileData) {
          setUser(prev => prev ? { ...prev, ...profileData } : prev);
          toast({
            title: "Profile updated",
            description: "Your profile has been refreshed with the latest data"
          });
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
        toast({
          title: "Error refreshing profile",
          description: "Could not refresh your profile. Please try again later."
        });
      }
    }
  };

  if (!isLoggedIn()) {
    return (
      <Layout>
        <LibraryLoginState />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          <ProfileHeader 
            user={user} 
            toggleRelaySettings={toggleRelaySettings} 
            refreshUserProfile={refreshUserProfile}
          />

          <RelaySettingsPanel visible={showRelaySettings} />

          <Separator />

          <StatsCards 
            books={books} 
            postsCount={posts.length} 
            onTabChange={handleTabChange}
          />

          <LibraryTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            books={books}
            posts={posts}
            reviews={reviews}
            booksLoading={booksLoading}
            postsLoading={postsLoading}
            reviewsLoading={reviewsLoading}
            refetchBooks={refetchBooks}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Library;
