import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, Trophy, Users, Zap } from "lucide-react";
import { nip19 } from "nostr-tools";
import { fetchUserProfile, followUser, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topReaders, setTopReaders] = useState([]);
  const [suggestedFollows, setSuggestedFollows] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setRecentActivity([
      {
        id: "1",
        pubkey: "npub1abc123...",
        name: "Alice Reader",
        picture: "https://i.pravatar.cc/150?img=1", 
        activity: "Reviewed 'The Great Gatsby'",
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: "2",
        pubkey: "npub2def456...",
        name: "Bob Bookworm",
        picture: "https://i.pravatar.cc/150?img=2",
        activity: "Finished 'To Kill a Mockingbird'",
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        id: "3",
        pubkey: "npub3ghi789...",
        name: "Charlie Pages",
        picture: "https://i.pravatar.cc/150?img=3",
        activity: "Added 'Dune' to their TBR list",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      }
    ]);

    setTopReaders([
      {
        id: "4",
        pubkey: "npub4jkl012...",
        name: "Dana Novels",
        picture: "https://i.pravatar.cc/150?img=4",
        stats: { books: 253, reviews: 142, rating: 4.2 },
        badge: "Most Books Read"
      },
      {
        id: "5",
        pubkey: "npub5mno345...",
        name: "Erik Chapters",
        picture: "https://i.pravatar.cc/150?img=5",
        stats: { books: 184, reviews: 179, rating: 4.7 },
        badge: "Top Reviewer"
      },
      {
        id: "6",
        pubkey: "npub6pqr678...",
        name: "Fiona Margins",
        picture: "https://i.pravatar.cc/150?img=6",
        stats: { books: 176, reviews: 98, rating: 4.9 },
        badge: "Highest Ratings"
      }
    ]);

    setSuggestedFollows([
      {
        id: "7",
        pubkey: "npub7stu901...",
        name: "George Fiction",
        picture: "https://i.pravatar.cc/150?img=7",
        commonInterests: ["Science Fiction", "Mystery", "Historical Fiction"],
        mutualFollowers: 5
      },
      {
        id: "8",
        pubkey: "npub8vwx234...",
        name: "Hannah Stories",
        picture: "https://i.pravatar.cc/150?img=8",
        commonInterests: ["Fantasy", "Young Adult", "Classics"],
        mutualFollowers: 3
      },
      {
        id: "9",
        pubkey: "npub9yz567...",
        name: "Ian Plots",
        picture: "https://i.pravatar.cc/150?img=9",
        commonInterests: ["Biography", "Self-Help", "Science"],
        mutualFollowers: 2
      }
    ]);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search query empty",
        description: "Please enter a username or npub to search.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    
    setTimeout(() => {
      setSearchResults([
        {
          id: "10",
          pubkey: "npub10abc...",
          name: searchQuery,
          picture: "https://i.pravatar.cc/150?img=10",
          bio: "Avid reader with a passion for fantasy and science fiction."
        }
      ]);
      setIsSearching(false);
    }, 1000);
  };

  const handleFollow = async (userId) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }

    try {
      await followUser(userId);
      toast({
        title: "Success!",
        description: "You are now following this user",
      });
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Could not follow this user",
        variant: "destructive"
      });
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Find Friends</h1>
          <p className="text-muted-foreground">
            Discover fellow readers on Nostr and connect with them.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search by username or npub..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="text-xs truncate">
                        {user.pubkey}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{user.bio}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/user/${user.pubkey}`)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleFollow(user.pubkey)}
                    >
                      Follow
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="recent">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">
              <Zap className="h-4 w-4 mr-2" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="top">
              <Trophy className="h-4 w-4 mr-2" />
              Top Readers
            </TabsTrigger>
            <TabsTrigger value="suggested">
              <Users className="h-4 w-4 mr-2" />
              Suggested
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentActivity.map((activity) => (
                  <Card key={activity.id}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.picture} alt={activity.name} />
                        <AvatarFallback>{activity.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{activity.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {formatTimestamp(activity.timestamp)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{activity.activity}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/user/${activity.pubkey}`)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleFollow(activity.pubkey)}
                      >
                        Follow
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="top" className="mt-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Top Readers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topReaders.map((reader) => (
                  <Card key={reader.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={reader.picture} alt={reader.name} />
                            <AvatarFallback>{reader.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{reader.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {reader.badge}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-2xl font-bold">{reader.stats.books}</p>
                          <p className="text-xs text-muted-foreground">Books Read</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{reader.stats.reviews}</p>
                          <p className="text-xs text-muted-foreground">Reviews</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{reader.stats.rating}</p>
                          <p className="text-xs text-muted-foreground">Avg Rating</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/user/${reader.pubkey}`)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleFollow(reader.pubkey)}
                      >
                        Follow
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggested" className="mt-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Suggested for You</h2>
              <p className="text-sm text-muted-foreground">
                Based on your reading preferences and mutual connections
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedFollows.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={suggestion.picture} alt={suggestion.name} />
                        <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {suggestion.mutualFollowers} mutual connection{suggestion.mutualFollowers !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-1">Common interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.commonInterests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/user/${suggestion.pubkey}`)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleFollow(suggestion.pubkey)}
                      >
                        Follow
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserSearch;
