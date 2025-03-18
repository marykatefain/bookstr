import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/components/BookCard";
import { fetchUserBooks, fetchBookPosts, getCurrentUser, isLoggedIn } from "@/lib/nostr";
import { Book, Post } from "@/lib/nostr/types";
import { EmptyState } from "@/components/profile/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/post/PostCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Separator } from "@/components/ui/separator";
import { StatsCards } from "@/components/profile/StatsCards";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

const Library: React.FC = () => {
  const [booksLoading, setBooksLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showRelaySettings, setShowRelaySettings] = useState(false);
  const [books, setBooks] = useState<{
    tbr: Book[];
    reading: Book[];
    read: Book[];
  }>({
    tbr: [],
    reading: [],
    read: [],
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn()) {
        setBooksLoading(false);
        setPostsLoading(false);
        return;
      }

      try {
        setBooksLoading(true);
        const userBooks = await fetchUserBooks(user?.pubkey);
        setBooks(userBooks);
      } catch (error) {
        console.error("Error fetching user books:", error);
        toast({
          title: "Error",
          description: "Failed to load your books",
          variant: "destructive",
        });
      } finally {
        setBooksLoading(false);
      }

      try {
        setPostsLoading(true);
        console.log("Fetching book posts for user:", user?.pubkey);
        const userPosts = await fetchBookPosts(user?.pubkey, false);
        console.log("Fetched posts:", userPosts);
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching user posts:", error);
        toast({
          title: "Error",
          description: "Failed to load your posts",
          variant: "destructive",
        });
      } finally {
        setPostsLoading(false);
      }
    };

    if (user?.pubkey) {
      loadUserData();
    }
  }, [toast, user]);

  const toggleRelaySettings = () => {
    setShowRelaySettings(!showRelaySettings);
  };

  if (!isLoggedIn()) {
    return (
      <Layout>
        <div className="container py-8">
          <EmptyState
            title="Sign in to view your library"
            description="Your reading list, current books, and reading history will appear here"
            actionText="Sign in with Nostr"
            actionType="login"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          <ProfileHeader 
            user={user} 
            toggleRelaySettings={toggleRelaySettings} 
          />

          {showRelaySettings && (
            <div className="animate-in fade-in slide-in-from-top-5 duration-300">
              <div className="p-4 border rounded-lg bg-background">
                <h3 className="text-lg font-medium mb-2">Relay Settings</h3>
                <p className="text-muted-foreground">Configure your Nostr relays here.</p>
              </div>
            </div>
          )}

          <Separator />

          <StatsCards 
            books={books} 
            postsCount={posts.length} 
          />

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
              <h2 className="text-2xl font-serif font-semibold mb-4">My Book Posts</h2>
              
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
        </div>
      </div>
    </Layout>
  );
};

export default Library;
