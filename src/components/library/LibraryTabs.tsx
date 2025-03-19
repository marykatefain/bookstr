
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/profile/EmptyState";
import { BookCard } from "@/components/BookCard";
import { PostCard } from "@/components/post/PostCard";
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
      <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-8">
        <TabsTrigger 
          value="posts" 
          className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          onClick={() => setActiveTab("posts")}
        >
          My Posts
          <div className={`${activeTab === "posts" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
        </TabsTrigger>
        <TabsTrigger 
          value="books" 
          className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          onClick={() => setActiveTab("books")}
        >
          My Books
          <div className={`${activeTab === "books" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="posts">
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[200px]"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-8">
            <EmptyState 
              title="No posts yet" 
              description="You haven't created any book posts yet"
              actionText="Create a post"
              actionType="post"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="books">
        {booksLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[300px]"></div>
            ))}
          </div>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-serif font-semibold mb-4">Currently Reading</h2>
              {books.reading.length === 0 ? (
                <EmptyState type="reading" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.reading.map((book) => (
                    <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-serif font-semibold mb-4">Want to Read</h2>
              {books.tbr.length === 0 ? (
                <EmptyState type="want-to-read" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.tbr.map((book) => (
                    <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">Read</h2>
              {books.read.length === 0 ? (
                <EmptyState type="read" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.read.map((book) => (
                    <BookCard key={book.id} book={book} size="medium" onUpdate={() => {}} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
};
