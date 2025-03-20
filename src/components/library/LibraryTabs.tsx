
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LibraryTabList } from "./tabs/LibraryTabList";
import { PostsTabContent } from "./tabs/PostsTabContent";
import { BooksTabContent } from "./tabs/BooksTabContent";
import { ReviewsTabContent } from "./tabs/ReviewsTabContent";
import { Book, Post, BookReview } from "@/lib/nostr/types";

interface LibraryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  books: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
  posts: Post[];
  reviews: BookReview[];
  booksLoading: boolean;
  postsLoading: boolean;
  reviewsLoading: boolean;
  refetchBooks: () => void;
}

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  activeTab,
  setActiveTab,
  books,
  posts,
  reviews,
  booksLoading,
  postsLoading,
  reviewsLoading,
  refetchBooks
}) => {
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <LibraryTabList activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <TabsContent value="books">
        <BooksTabContent 
          books={books} 
          isLoading={booksLoading} 
          filterType="all"
          onUpdate={refetchBooks}
        />
      </TabsContent>
      
      <TabsContent value="reading">
        <BooksTabContent 
          books={books} 
          isLoading={booksLoading} 
          filterType="reading"
          onUpdate={refetchBooks}
        />
      </TabsContent>
      
      <TabsContent value="tbr">
        <BooksTabContent 
          books={books} 
          isLoading={booksLoading} 
          filterType="tbr"
          onUpdate={refetchBooks}
        />
      </TabsContent>
      
      <TabsContent value="read">
        <BooksTabContent 
          books={books} 
          isLoading={booksLoading} 
          filterType="read"
          onUpdate={refetchBooks}
        />
      </TabsContent>
      
      <TabsContent value="reviews">
        <ReviewsTabContent 
          reviews={reviews} 
          isLoading={reviewsLoading} 
        />
      </TabsContent>
      
      <TabsContent value="posts">
        <PostsTabContent posts={posts} isLoading={postsLoading} />
      </TabsContent>
    </Tabs>
  );
};
