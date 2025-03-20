
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchUserProfile, 
  fetchUserBooks,
  fetchUserReviews,
  fetchFollowingList,
  fetchUserPosts,
  isLoggedIn,
  getCurrentUser 
} from "@/lib/nostr";
import { NostrProfile, BookReview, Post } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { UserProfileHeader } from "@/components/user-profile/UserProfileHeader";
import { UserProfileStats } from "@/components/user-profile/UserProfileStats";
import { UserProfileTabs } from "@/components/user-profile/UserProfileTabs";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";

const UserProfile = () => {
  const navigate = useNavigate();
  const { pubkey } = useParams<{ pubkey: string }>();
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [userBooks, setUserBooks] = useState({
    tbr: [],
    reading: [],
    read: []
  });
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!pubkey) return;
      
      setLoading(true);
      try {
        let actualPubkey = pubkey;
        
        // Only try to decode if it starts with 'npub'
        if (pubkey.startsWith('npub')) {
          try {
            const decoded = nip19.decode(pubkey);
            if (decoded.type === 'npub') {
              actualPubkey = decoded.data as string;
            }
          } catch (e) {
            console.error("Error decoding npub:", e);
          }
        }
        
        const userProfile = await fetchUserProfile(actualPubkey);
        if (userProfile) {
          setProfile(userProfile);
        }
        
        const books = await fetchUserBooks(actualPubkey);
        setUserBooks(books);
        
        const userReviews = await fetchUserReviews(actualPubkey);
        setReviews(userReviews);
        
        if (currentUser) {
          const { follows } = await fetchFollowingList(currentUser.pubkey);
          setFollowing(follows.includes(actualPubkey));
        }
        
        setPostsLoading(true);
        try {
          console.log("Fetching user posts for pubkey:", actualPubkey);
          const userPosts = await fetchUserPosts(actualPubkey, false);
          console.log("Fetched posts:", userPosts);
          setPosts(userPosts);
        } catch (error) {
          console.error("Error fetching user posts:", error);
          toast({
            title: "Error",
            description: "Could not load user's posts",
            variant: "destructive"
          });
        } finally {
          setPostsLoading(false);
        }
        
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Could not load user profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Handle route change from /users/ to /user/
    if (window.location.pathname.includes('/users/')) {
      const newPath = window.location.pathname.replace('/users/', '/user/');
      navigate(newPath, { replace: true });
    } else {
      fetchProfile();
    }
  }, [pubkey, toast, currentUser, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[300px]" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">User Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            We couldn't find the user you're looking for.
          </p>
          <Link to="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const totalBooks = userBooks.tbr.length + userBooks.reading.length + userBooks.read.length;
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <UserProfileHeader 
            profile={profile} 
            following={following} 
            setFollowing={setFollowing}
            currentUserPubkey={currentUser?.pubkey}
          />
          
          <UserProfileStats 
            totalBooks={totalBooks}
            readingCount={userBooks.reading.length}
            postsCount={posts.length}
            reviewsCount={reviews.length}
          />
          
          <Separator className="my-6" />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <UserProfileTabs onTabChange={setActiveTab} />
            
            <UserProfileContent
              activeTab={activeTab}
              profile={profile}
              posts={posts}
              reviews={reviews}
              userBooks={userBooks}
              postsLoading={postsLoading}
            />
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
