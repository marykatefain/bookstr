
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Book, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { PostCard } from "@/components/post/PostCard";
import { ReviewCard } from "@/components/ReviewCard";
import { EmptyState } from "./EmptyState";
import { Book as BookType, BookReview, Post } from "@/lib/nostr/types";

interface ProfileTabsContentProps {
  activeTab: string;
  loading: boolean;
  books: {
    tbr: BookType[];
    reading: BookType[];
    read: BookType[];
  };
  posts: Post[];
  reviews: BookReview[];
  fetchBooks: () => void;
}

export const ProfileTabsContent: React.FC<ProfileTabsContentProps> = ({
  activeTab,
  loading,
  books,
  posts,
  reviews,
  fetchBooks
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderPosts = () => {
    if (posts.length > 0) {
      return (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          You haven't shared any posts yet
        </p>
        <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
          <Book className="mr-2 h-4 w-4" />
          Share What You're Reading
        </Button>
      </div>
    );
  };

  const renderReviews = () => {
    if (reviews.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review}
              bookTitle={review.bookTitle}
              showBookInfo={true}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          You haven't written any book reviews yet
        </p>
        <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
          <Book className="mr-2 h-4 w-4" />
          Discover Books to Review
        </Button>
      </div>
    );
  };

  const renderBookGrid = (bookList: BookType[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {bookList.map((book) => (
          <BookCard 
            key={book.id} 
            book={book}
            size="medium"
            onUpdate={fetchBooks}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <TabsContent value="posts" className="pt-6">
        {renderPosts()}
      </TabsContent>

      <TabsContent value="reviews" className="pt-6">
        {renderReviews()}
      </TabsContent>

      <TabsContent value="reading" className="pt-6">
        {books.reading.length > 0 ? renderBookGrid(books.reading) : <EmptyState type="reading" />}
      </TabsContent>

      <TabsContent value="read" className="pt-6">
        {books.read.length > 0 ? renderBookGrid(books.read) : <EmptyState type="read" />}
      </TabsContent>

      <TabsContent value="tbr" className="pt-6">
        {books.tbr.length > 0 ? renderBookGrid(books.tbr) : <EmptyState type="want-to-read" />}
      </TabsContent>
    </>
  );
};
