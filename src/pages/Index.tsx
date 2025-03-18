
import React from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";

const Index = () => {
  const { books: trendingBooks, loading: loadingTrending, refreshBooks: refreshTrending } = useWeeklyTrendingBooks(12);

  return (
    <Layout>
      <HeroSection />
      
      <SocialSection />

      <BookSection 
        title="Trending Books"
        books={trendingBooks}
        loading={loadingTrending}
        onUpdate={refreshTrending}
        useCarousel={true}
        totalBooks={12}
      />

      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
