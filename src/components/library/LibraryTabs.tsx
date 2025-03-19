
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
  refetchBooks: () => void;
}

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  activeTab,
  setActiveTab,
  books,
  posts,
  booksLoading,
  postsLoading,
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
      
      <TabsContent value="posts">
        <PostsTabContent posts={posts} isLoading={postsLoading} />
      </TabsContent>
    </Tabs>
  );
};
