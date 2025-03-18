
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
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const { 
    books: trendingBooks, 
    loading: loadingTrending, 
    refreshBooks: refreshTrending 
  } = useWeeklyTrendingBooks(8);
  
  const { 
    books: dailyBooks, 
    loading: loadingDaily, 
    refreshBooks: refreshDaily 
  } = useDailyTrendingBooks(4);
  
  const { 
    books: recentBooks, 
    loading: loadingRecent, 
    refreshBooks: refreshRecent 
  } = useRecentBooks(4);

  // Detailed logging on component mount to help debug API calls
  useEffect(() => {
    console.log("🚀 HomePage initialized, starting API fetches");
    return () => {
      console.log("📤 HomePage unmounted");
    };
  }, []);

  // Log the loading status when it changes
  useEffect(() => {
    console.log("📊 Homepage loading state:", {
      trending: { loading: loadingTrending, count: trendingBooks.length },
      daily: { loading: loadingDaily, count: dailyBooks.length },
      recent: { loading: loadingRecent, count: recentBooks.length }
    });
  }, [
    loadingTrending, loadingDaily, loadingRecent, 
    trendingBooks.length, dailyBooks.length, recentBooks.length
  ]);

  // Show toast if everything loaded
  useEffect(() => {
    const allLoaded = !loadingTrending && !loadingDaily && !loadingRecent;
    const hasData = trendingBooks.length > 0 || dailyBooks.length > 0 || recentBooks.length > 0;
    
    if (allLoaded && !hasData) {
      console.error("📛 Failed to load any books data");
      toast({
        title: "Connection issues",
        description: "Having trouble connecting to book services. Pull down to refresh.",
        variant: "destructive",
      });
    }
  }, [
    loadingTrending, loadingDaily, loadingRecent, 
    trendingBooks.length, dailyBooks.length, recentBooks.length,
    toast
  ]);

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
