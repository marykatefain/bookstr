
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Book, Star, Edit, BookOpen, BookMarked, Send, Share2, Link } from "lucide-react";
import { getCurrentUser, mockBooks, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

const mockReadingStatuses = [
  { bookId: "1", status: "read", dateAdded: Date.now() - 1000000000, dateStarted: Date.now() - 900000000, dateFinished: Date.now() - 800000000, rating: 4 },
  { bookId: "2", status: "reading", dateAdded: Date.now() - 500000000, dateStarted: Date.now() - 400000000 },
  { bookId: "3", status: "want-to-read", dateAdded: Date.now() - 200000000 }
];

const Profile = () => {
  const { toast } = useToast();
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState("reading");
  
  // Redirect if not logged in
  if (!isLoggedIn()) {
    return <Navigate to="/" />;
  }

  const filteredBooks = (status: string) => {
    const statusBooks = mockReadingStatuses.filter(rs => rs.status === status);
    return statusBooks.map(rs => {
      const book = mockBooks.find(b => b.id === rs.bookId);
      return { ...book, readingStatus: rs };
    });
  };

  const readingBooks = filteredBooks("reading");
  const readBooks = filteredBooks("read");
  const wantToReadBooks = filteredBooks("want-to-read");

  const copyProfileLink = () => {
    // In a real app, this would copy a profile link with the user's npub
    navigator.clipboard.writeText(`https://bookverse.app/profile/${user?.npub}`);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard"
    });
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          {/* Profile header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img
                src={user?.picture || "https://i.pravatar.cc/300"}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold font-serif text-bookverse-ink">{user?.name || user?.displayName || "Nostr User"}</h1>
                <p className="text-muted-foreground">{user?.npub}</p>
                <p className="mt-2">{user?.about || "No bio yet"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={copyProfileLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Profile Link
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
                <Button size="sm" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reading stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{readingBooks.length}</div>
                  <p className="text-muted-foreground">Currently Reading</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Book className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{readBooks.length}</div>
                  <p className="text-muted-foreground">Books Read</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookMarked className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{wantToReadBooks.length}</div>
                  <p className="text-muted-foreground">Want to Read</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookshelf tabs */}
          <Tabs defaultValue="reading" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-8">
              <TabsTrigger value="reading" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Currently Reading
                <div className={`${activeTab === "reading" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="read" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Read
                <div className={`${activeTab === "read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="want-to-read" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Want to Read
                <div className={`${activeTab === "want-to-read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reading" className="pt-6">
              {readingBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {readingBooks.map((book) => (
                    <Card key={book!.id} className="overflow-hidden h-full book-card">
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] book-cover">
                          <img
                            src={book!.coverUrl}
                            alt={`${book!.title} by ${book!.author}`}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute top-2 right-2 bg-bookverse-highlight text-white py-1 px-2 rounded-md text-xs font-medium">
                            Reading
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold font-serif truncate">{book!.title}</h3>
                          <p className="text-sm text-muted-foreground">by {book!.author}</p>
                          <div className="pt-2">
                            <Button
                              size="sm"
                              className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
                            >
                              <Send className="mr-1 h-4 w-4" />
                              Update Progress
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="reading" />
              )}
            </TabsContent>

            <TabsContent value="read" className="pt-6">
              {readBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {readBooks.map((book) => (
                    <Card key={book!.id} className="overflow-hidden h-full book-card">
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] book-cover">
                          <img
                            src={book!.coverUrl}
                            alt={`${book!.title} by ${book!.author}`}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white py-1 px-2 rounded-md text-xs font-medium">
                            Read
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold font-serif truncate">{book!.title}</h3>
                          <p className="text-sm text-muted-foreground">by {book!.author}</p>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (book!.readingStatus?.rating || 0) 
                                    ? "text-bookverse-highlight fill-bookverse-highlight" 
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                            >
                              Write Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="read" />
              )}
            </TabsContent>

            <TabsContent value="want-to-read" className="pt-6">
              {wantToReadBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {wantToReadBooks.map((book) => (
                    <Card key={book!.id} className="overflow-hidden h-full book-card">
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] book-cover">
                          <img
                            src={book!.coverUrl}
                            alt={`${book!.title} by ${book!.author}`}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute top-2 right-2 bg-blue-500 text-white py-1 px-2 rounded-md text-xs font-medium">
                            Want to Read
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold font-serif truncate">{book!.title}</h3>
                          <p className="text-sm text-muted-foreground">by {book!.author}</p>
                          <div className="pt-2">
                            <Button
                              size="sm"
                              className="w-full bg-bookverse-accent hover:bg-bookverse-highlight"
                            >
                              <BookOpen className="mr-1 h-4 w-4" />
                              Start Reading
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="want-to-read" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

// Empty state component
const EmptyBookshelf = ({ type }: { type: string }) => {
  const messages = {
    reading: {
      title: "No books currently reading",
      description: "Books you start reading will appear here",
      icon: BookOpen
    },
    read: {
      title: "No books read yet",
      description: "Books you've finished will appear here",
      icon: Book
    },
    "want-to-read": {
      title: "No books in your want to read list",
      description: "Books you want to read in the future will appear here",
      icon: BookMarked
    }
  };

  const message = messages[type as keyof typeof messages];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <message.icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{message.title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {message.description}
      </p>
      <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
        <Book className="mr-2 h-4 w-4" />
        Discover Books
      </Button>
    </div>
  );
};

export default Profile;
