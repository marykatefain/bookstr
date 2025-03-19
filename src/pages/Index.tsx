
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
  
  // Create a right sidebar with trending books for large screens
  const rightSidebar = (
    <TrendingSidebar 
      books={trendingBooks} 
      loading={loadingTrending} 
      refreshBooks={refreshTrending}
    />
  );
  
  return (
    <Layout rightSidebar={rightSidebar}>
      <HeroSection />
      
      <SocialSection />

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
