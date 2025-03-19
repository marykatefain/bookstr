
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCards } from "@/components/profile/StatsCards";
import { LibraryLoginState } from "@/components/library/LibraryLoginState";
import { RelaySettingsPanel } from "@/components/library/RelaySettingsPanel";
import { LibraryTabs } from "@/components/library/LibraryTabs";
import { useLibraryData } from "@/hooks/use-library-data";
import { isLoggedIn } from "@/lib/nostr";

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState("books");
  const [showRelaySettings, setShowRelaySettings] = useState(false);
  const { user, books, posts, booksLoading, postsLoading, refetchBooks } = useLibraryData();

  const toggleRelaySettings = () => {
    setShowRelaySettings(!showRelaySettings);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
            booksLoading={booksLoading}
            postsLoading={postsLoading}
            refetchBooks={refetchBooks}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Library;
