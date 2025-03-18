
import React, { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";
import { useDailyTrendingBooks } from "@/hooks/use-daily-trending-books";
import { useRecentBooks } from "@/hooks/use-recent-books";

const Index = () => {
  const { books: trendingBooks, loading: loadingTrending, refreshBooks: refreshTrending } = useWeeklyTrendingBooks(8);
  const { books: dailyBooks, loading: loadingDaily, refreshBooks: refreshDaily } = useDailyTrendingBooks(4);
  const { books: recentBooks, loading: loadingRecent, refreshBooks: refreshRecent } = useRecentBooks(4);

  // Log the loading status when it changes
  useEffect(() => {
    console.log("Homepage loading state:", {
      trending: { loading: loadingTrending, count: trendingBooks.length },
      daily: { loading: loadingDaily, count: dailyBooks.length },
      recent: { loading: loadingRecent, count: recentBooks.length }
    });
  }, [loadingTrending, loadingDaily, loadingRecent, trendingBooks.length, dailyBooks.length, recentBooks.length]);

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
        totalBooks={8}
      />

      <BookSection 
        title="Today's Picks"
        books={dailyBooks}
        loading={loadingDaily}
        onUpdate={refreshDaily}
        useCarousel={false}
        totalBooks={4}
      />
      
      <BookSection 
        title="Recent Additions"
        books={recentBooks}
        loading={loadingRecent}
        onUpdate={refreshRecent}
        useCarousel={false}
        totalBooks={4}
      />

      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
