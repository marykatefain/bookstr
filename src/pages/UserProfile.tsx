
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Book, Check, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCard } from "@/components/BookCard";
import { SocialFeed } from "@/components/SocialFeed";
import { 
  fetchUserProfile, 
  fetchUserBooks,
  fetchFollowingList,
  followUser,
  isLoggedIn,
  getCurrentUser 
} from "@/lib/nostr";
import { NostrProfile } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";

interface TabCountProps {
  label: string;
  count: number;
}

const TabCount: React.FC<TabCountProps> = ({ label, count }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold">{count}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const UserProfile = () => {
  const { pubkey } = useParams<{ pubkey: string }>();
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [userBooks, setUserBooks] = useState({
    tbr: [],
    reading: [],
    read: []
  });
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!pubkey) return;
      
      setLoading(true);
      try {
        // Try to decode npub to pubkey if needed
        let actualPubkey = pubkey;
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
        
        // Fetch profile and books
        const userProfile = await fetchUserProfile(actualPubkey);
        if (userProfile) {
          setProfile(userProfile);
        }
        
        const books = await fetchUserBooks(actualPubkey);
        setUserBooks(books);
        
        // Check if current user follows this user
        if (currentUser) {
          const { follows } = await fetchFollowingList(currentUser.pubkey);
          setFollowing(follows.includes(actualPubkey));
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
    
    fetchProfile();
  }, [pubkey, toast, currentUser]);

  const handleFollow = async () => {
    if (!profile || !isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }
    
    setFollowLoading(true);
    try {
      await followUser(profile.pubkey);
      setFollowing(true);
      toast({
        title: "Success",
        description: `You are now following ${profile.name || 'this user'}`
      });
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Could not follow user",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const formatPubkey = (key: string): string => {
    try {
      const npub = nip19.npubEncode(key);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${key.slice(0, 6)}...${key.slice(-4)}`;
    }
  };

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
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-bookverse-accent">
            <AvatarImage src={profile.picture} />
            <AvatarFallback className="text-xl">
              {(profile.name || profile.display_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {profile.name || profile.display_name || formatPubkey(profile.pubkey)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPubkey(profile.pubkey)}
            </p>
          </div>
          
          {profile.about && (
            <p className="text-center max-w-lg text-muted-foreground">
              {profile.about}
            </p>
          )}
          
          {/* Follow Button */}
          {currentUser && currentUser.pubkey !== profile.pubkey && (
            <Button 
              onClick={handleFollow} 
              disabled={following || followLoading}
              variant={following ? "outline" : "default"}
            >
              {following ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          )}
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-2">
            <TabCount label="Books" count={totalBooks} />
            <TabCount label="Reading" count={userBooks.reading.length} />
            <TabCount label="Read" count={userBooks.read.length} />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Tabs */}
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="library">
              <Book className="mr-2 h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Users className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library">
            <div className="space-y-8">
              {/* Reading Now */}
              <div>
                <h2 className="text-xl font-bold mb-4">Reading Now</h2>
                {userBooks.reading.length === 0 ? (
                  <p className="text-muted-foreground">No books currently being read.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userBooks.reading.map(book => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        size="small"
                        showDescription={false}
                        onUpdate={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Finished Reading */}
              <div>
                <h2 className="text-xl font-bold mb-4">Finished Reading</h2>
                {userBooks.read.length === 0 ? (
                  <p className="text-muted-foreground">No finished books yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userBooks.read.map(book => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        size="small"
                        showDescription={false}
                        onUpdate={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* To Be Read */}
              <div>
                <h2 className="text-xl font-bold mb-4">Want to Read</h2>
                {userBooks.tbr.length === 0 ? (
                  <p className="text-muted-foreground">No books on the TBR list yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userBooks.tbr.map(book => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        size="small"
                        showDescription={false}
                        onUpdate={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <SocialFeed />
          </TabsContent>
          
          <TabsContent value="about">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-xl font-bold">About</h2>
              
              {profile.about ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.about}</p>
              ) : (
                <p className="text-muted-foreground">No bio available.</p>
              )}
              
              {profile.website && (
                <div>
                  <h3 className="font-medium mt-4">Website</h3>
                  <a 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-bookverse-accent hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
