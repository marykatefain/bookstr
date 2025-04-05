
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { UserPostsTab } from "./UserPostsTab";
import { UserReviewsTab } from "./UserReviewsTab";
import { UserLibraryTab } from "./UserLibraryTab";
import { UserAboutTab } from "./UserAboutTab";
import { NostrProfile, BookReview, Post } from "@/lib/nostr/types";

interface UserProfileContentProps {
  activeTab: string;
  profile: NostrProfile | null;
  posts: Post[];
  reviews: BookReview[];
  userBooks: {
    tbr: any[];
    reading: any[];
    read: any[];
  };
  postsLoading: boolean;
}

export const UserProfileContent: React.FC<UserProfileContentProps> = ({
  activeTab,
  profile,
  posts,
  reviews,
  userBooks,
  postsLoading
}) => {
  if (!profile) return null;

  return (
    <>
      <TabsContent value="posts">
        <UserPostsTab posts={posts} postsLoading={postsLoading} />
      </TabsContent>
      
      <TabsContent value="reviews">
        <UserReviewsTab reviews={reviews} />
      </TabsContent>
      
      <TabsContent value="library">
        <UserLibraryTab userBooks={userBooks} />
      </TabsContent>
      
      <TabsContent value="about">
        <UserAboutTab profile={profile} />
      </TabsContent>
    </>
  );
};
