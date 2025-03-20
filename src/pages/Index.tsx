
import React from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { StatsSidebar } from "@/components/homepage/StatsSidebar";
import { isLoggedIn } from "@/lib/nostr";

const Index = () => {
  // Only show the StatsSidebar for logged-in users
  // For logged-out users, no sidebar is shown since trending books are in the hero
  const rightSidebar = isLoggedIn() ? <StatsSidebar /> : null;

  return (
    <Layout rightSidebar={rightSidebar}>
      <HeroSection />
      
      <div className="container px-4 md:px-6 max-w-screen-xl mx-auto">
        <div className="flex flex-col py-8">
          {/* Main content area with max-width */}
          <div className="flex-1 mx-auto w-full max-w-3xl">
            <SocialSection />
          </div>
        </div>
      </div>
      
      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
