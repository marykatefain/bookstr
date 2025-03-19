
import React from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { TrendingSidebar } from "@/components/homepage/TrendingSidebar";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyTrendingBooks } from "@/lib/openlibrary";

const Index = () => {
  const { 
    data: trendingBooks = [], 
    isLoading: loadingTrending,
    refetch: refreshTrending 
  } = useQuery({
    queryKey: ['trendingBooks', 10],
    queryFn: async () => {
      console.log('Fetching trending books for homepage');
      const books = await getWeeklyTrendingBooks(10);
      console.log(`Received ${books.length} trending books for homepage`);
      return books;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  return (
    <Layout>
      <HeroSection />
      
      <div className="container px-4 md:px-6 max-w-screen-xl mx-auto">
        <div className="flex flex-col xl:flex-row xl:gap-6 py-8">
          {/* Main content area */}
          <div className="flex-1">
            <SocialSection />
          </div>
          
          {/* Right sidebar - only visible on xl screens and up */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <TrendingSidebar 
              books={trendingBooks} 
              loading={loadingTrending} 
              refreshBooks={refreshTrending}
            />
          </div>
        </div>
      </div>
      
      {/* Only show BookSection with trending books on screens below xl breakpoint */}
      <div className="xl:hidden">
        <BookSection 
          title="Trending Books"
          books={trendingBooks}
          loading={loadingTrending}
          onUpdate={refreshTrending}
          useCarousel={true}
          totalBooks={10}
        />
      </div>
      
      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
