
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/components/BookCard";
import { fetchUserBooks, fetchBookPosts, getCurrentUser, isLoggedIn } from "@/lib/nostr";
import { Book, Post } from "@/lib/nostr/types";
import { EmptyState } from "@/components/profile/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/post/PostCard";

const Library: React.FC = () => {
  const [booksLoading, setBooksLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
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
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn()) {
        setBooksLoading(false);
        setPostsLoading(false);
        return;
      }

      try {
        setBooksLoading(true);
        const userBooks = await fetchUserBooks(currentUser?.pubkey);
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
        console.log("Fetching book posts for user:", currentUser?.pubkey);
        const userPosts = await fetchBookPosts(currentUser?.pubkey, false);
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

    loadUserData();
  }, [toast, currentUser]);

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
      <div className="container py-8">
        <h1 className="text-3xl font-bold font-serif mb-8">My Library</h1>
        
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="books">My Books</TabsTrigger>
            <TabsTrigger value="posts">My Posts</TabsTrigger>
          </TabsList>
          
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
                    <p className="text-muted-foreground">You're not reading any books at the moment.</p>
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
                    <p className="text-muted-foreground">You haven't added any books to your 'Want to Read' list.</p>
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
                    <p className="text-muted-foreground">You haven't marked any books as read yet.</p>
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
          
          <TabsContent value="posts">
            <h2 className="text-2xl font-serif font-semibold mb-4">My Book Posts</h2>
            
            {postsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[200px]"></div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <p className="text-muted-foreground">You haven't created any book posts yet.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Library;
