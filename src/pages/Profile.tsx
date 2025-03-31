
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Book } from "lucide-react";
import { 
  getCurrentUser, 
  isLoggedIn, 
  fetchProfileData,
  fetchUserBooks,
  fetchUserReviews
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { RelaySettings } from "@/components/RelaySettings";
import { Book as BookType, BookReview, Post } from "@/lib/nostr/types";
import { fetchUserPosts } from "@/lib/nostr/posts";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCards } from "@/components/profile/StatsCards";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileTabsContent } from "@/components/profile/ProfileTabsContent";

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState("posts");
  const [showRelaySettings, setShowRelaySettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<{
    tbr: BookType[],
    reading: BookType[],
    read: BookType[]
  }>({
    tbr: [],
    reading: [],
    read: []
  });
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const fetchBooks = async () => {
    if (user?.pubkey) {
      setLoading(true);
      try {
        const userBooks = await fetchUserBooks(user.pubkey);
        console.log("Fetched user books:", userBooks);
        setBooks(userBooks);
      } catch (error) {
        console.error("Error fetching user books:", error);
        toast({
          title: "Error fetching books",
          description: "Could not retrieve your books. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // This effect will run whenever the current user changes
  // which will happen when updateUserProfile is called after profile updates
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser && JSON.stringify(storedUser) !== JSON.stringify(user)) {
      setUser(storedUser);
      console.log("User state updated from localStorage", storedUser);
    }
  }, [user]);

  useEffect(() => {
    if (user?.pubkey) {
      fetchProfileData(user.pubkey)
        .then(profileData => {
          if (profileData) {
            setUser(prev => prev ? { ...prev, ...profileData } : prev);
          }
        })
        .catch(error => {
          console.error("Error fetching profile data:", error);
        });
      
      fetchBooks();
      
      setLoading(true);
      
      fetchUserReviews(user.pubkey)
        .then(userReviews => {
          setReviews(userReviews);
        })
        .catch(error => {
          console.error("Error fetching user reviews:", error);
        });
        
      fetchUserPosts(user.pubkey)
        .then(userPosts => {
          setPosts(userPosts);
        })
        .catch(error => {
          console.error("Error fetching user posts:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user?.pubkey]);
  
  if (!isLoggedIn()) {
    return <Navigate to="/" />;
  }

  const toggleRelaySettings = () => {
    setShowRelaySettings(!showRelaySettings);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

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
              <RelaySettings />
            </div>
          )}

          <Separator />

          <StatsCards 
            books={books} 
            postsCount={posts.length} 
            onTabChange={handleTabChange}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ProfileTabs 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
            
            <ProfileTabsContent
              activeTab={activeTab}
              loading={loading}
              books={books}
              posts={posts}
              reviews={reviews}
              fetchBooks={fetchBooks}
            />
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
