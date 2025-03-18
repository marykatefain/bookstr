
import React from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";
import { useDailyTrendingBooks } from "@/hooks/use-daily-trending-books";

const Index = () => {
  const { books: trendingBooks, loading: loadingTrending, refreshBooks: refreshTrending } = useWeeklyTrendingBooks(20);
  const { books: topToday, loading: loadingDaily, refreshBooks: refreshDaily } = useDailyTrendingBooks(4);

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
        totalBooks={20}
      />

      <Separator />

      <BookSection 
        title="Top Today"
        books={topToday}
        loading={loadingDaily}
        onUpdate={refreshDaily}
      />

      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
