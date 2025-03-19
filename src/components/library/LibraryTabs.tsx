
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LibraryTabList } from "./tabs/LibraryTabList";
import { PostsTabContent } from "./tabs/PostsTabContent";
import { BooksTabContent } from "./tabs/BooksTabContent";
import { Book, Post } from "@/lib/nostr/types";

interface LibraryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  books: {
    tbr: Book[];
    reading: Book[];
    read: Book[];
  };
  posts: Post[];
  booksLoading: boolean;
  postsLoading: boolean;
}

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  activeTab,
  setActiveTab,
  books,
  posts,
  booksLoading,
  postsLoading,
}) => {
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <LibraryTabList activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <TabsContent value="posts">
        <PostsTabContent posts={posts} isLoading={postsLoading} />
      </TabsContent>
      
      <TabsContent value="books">
        <BooksTabContent books={books} isLoading={booksLoading} />
      </TabsContent>
    </Tabs>
  );
};
