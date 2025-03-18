
import React from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { useTrendingBooks } from "@/hooks/use-trending-books";

const Index = () => {
  const { 
    books: trendingBooks, 
    loading: loadingTrending, 
    refreshBooks: refreshTrending 
  } = useTrendingBooks(3);
  
  return (
    <Layout>
      <HeroSection />
      
      <SocialSection />

      <BookSection 
        title="Trending Books"
        books={trendingBooks}
        loading={loadingTrending}
        onUpdate={refreshTrending}
        useCarousel={false}
        totalBooks={3}
      />
      
      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
