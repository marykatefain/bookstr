
import React from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/homepage/HeroSection";
import { SocialSection } from "@/components/homepage/SocialSection";
import { BookSection } from "@/components/homepage/BookSection";
import { JoinCommunitySection } from "@/components/homepage/JoinCommunitySection";
import { useTrendingBooks } from "@/hooks/use-trending-books";
import { useRecentBooks } from "@/hooks/use-recent-books";

const Index = () => {
  const { books: featuredBooks, loading: loadingFeatured, refreshBooks: refreshFeatured } = useTrendingBooks(3);
  const { books: recentlyAdded, loading: loadingRecent, refreshBooks: refreshRecent } = useRecentBooks(3);

  return (
    <Layout>
      <HeroSection />
      
      <SocialSection />

      <BookSection 
        title="Featured Books"
        books={featuredBooks}
        loading={loadingFeatured}
        onUpdate={refreshFeatured}
      />

      <Separator />

      <BookSection 
        title="Recently Added"
        books={recentlyAdded}
        loading={loadingRecent}
        onUpdate={refreshRecent}
      />

      <JoinCommunitySection />
    </Layout>
  );
};

export default Index;
