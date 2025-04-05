
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  followUser,
  isLoggedIn,
  getCurrentUser,
  isBlocked
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { UserProfileHeader } from "@/components/user-profile/UserProfileHeader";
import { UserProfileStats } from "@/components/user-profile/UserProfileStats";
import { UserProfileTabs } from "@/components/user-profile/UserProfileTabs";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";
import { BlockedUserBanner } from "@/components/user-profile/BlockedUserBanner";
import { useUserProfile } from "@/hooks/use-user-profile";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pubkey } = useParams<{ pubkey: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [redirected, setRedirected] = useState(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [showBlockedContent, setShowBlockedContent] = useState(false);
  
  // Check if this user is blocked
  const userIsBlocked = pubkey ? isBlocked(pubkey) : false;

  // Use our new hook for profile data
  const {
    profile,
    following: followingStatus,
    userBooks,
    reviews,
    posts,
    isLoading,
    postsLoading,
    totalBooks
  } = useUserProfile(pubkey);

  // Set following state from query result
  useEffect(() => {
    if (followingStatus !== undefined) {
      setFollowing(followingStatus);
    }
  }, [followingStatus]);

  // Handle redirect from /users/ to /user/ only once
  useEffect(() => {
    if (location.pathname.includes('/users/') && !redirected) {
      setRedirected(true);
      const newPath = location.pathname.replace('/users/', '/user/');
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, navigate, redirected]);

  // Handle follow action
  const handleFollow = async (pubkeyToFollow: string) => {
    if (!isLoggedIn() || !currentUser) {
      toast({
        title: "Login Required",
        description: "You need to log in to follow users",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await followUser(pubkeyToFollow);
      if (result !== null) {
        setFollowing(true);
        toast({
          title: "Success",
          description: `You are now following ${profile?.name || 'this user'}`
        });
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Could not follow user",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
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
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <UserProfileHeader 
            profile={profile} 
            following={following} 
            setFollowing={setFollowing}
            currentUserPubkey={currentUser?.pubkey}
            onFollow={handleFollow}
          />
          
          {userIsBlocked && profile && (
            <BlockedUserBanner 
              profile={profile} 
              onToggleContent={() => setShowBlockedContent(!showBlockedContent)} 
              showContent={showBlockedContent}
            />
          )}
          
          {(!userIsBlocked || showBlockedContent) && (
            <>
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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
