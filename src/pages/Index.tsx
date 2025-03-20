
import React from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { StatsSidebar } from "@/components/homepage/StatsSidebar";
import { TrendingSidebar } from "@/components/homepage/TrendingSidebar";
import { isLoggedIn } from "@/lib/nostr";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";

const Index = () => {
  const { books, loading, refreshBooks } = useWeeklyTrendingBooks(10);
  
  // Determine which sidebar to show based on login status
  const rightSidebar = isLoggedIn() ? (
    <StatsSidebar />
  ) : (
    <TrendingSidebar 
      books={books} 
      loading={loading} 
      refreshBooks={refreshBooks} 
    />
  );

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
