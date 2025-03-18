
import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  TrendingUp,
  Clock,
  Star,
  BookOpen,
  PlusCircle,
  Loader2
} from "lucide-react";
import { mockBooks, addBookToTBR, markBookAsReading, isLoggedIn, Book } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [pendingActions, setPendingActions] = useState<Record<string, string>>({});

  const featuredBooks = mockBooks.slice(0, 3);
  const recentBooks = mockBooks.slice(3, 9);

  const addToLibrary = async (book: Book, status: 'tbr' | 'reading') => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to add books to your library",
        variant: "destructive"
      });
      return;
    }

    // Set pending state for this book
    setPendingActions(prev => ({ ...prev, [book.id]: status }));

    try {
      let result: string | null;
      
      if (status === 'tbr') {
        result = await addBookToTBR(book);
      } else {
        result = await markBookAsReading(book);
      }

      if (result) {
        toast({
          title: `Added to your ${status === 'tbr' ? 'TBR' : 'currently reading'} list`,
          description: `${book.title} has been added to your library`
        });
      }
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive"
      });
    } finally {
      // Clear pending state
      setPendingActions(prev => {
        const newState = { ...prev };
        delete newState[book.id];
        return newState;
      });
    }
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        {/* Hero section */}
        <div className="flex flex-col lg:flex-row gap-8 items-center mb-12">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-bookverse-ink">
              Your digital bookshelf, powered by Nostr
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your reading, discover new books, and connect with readers around the world
              through the decentralized Nostr network.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                <Link to="/books">Discover Books</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/profile">Your Library</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative max-w-lg">
            <img
              src="/placeholder.svg"
              alt="BookVerse"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Featured books section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-bookverse-ink mb-1">Featured Books</h2>
              <p className="text-muted-foreground">Curated selections just for you</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/books" className="flex items-center">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden book-card">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 aspect-[2/3]">
                      <img
                        src={book.coverUrl}
                        alt={`${book.title} by ${book.author}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="w-full md:w-2/3 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold font-serif truncate">{book.title}</h3>
                        <p className="text-sm text-muted-foreground">by {book.author}</p>
                        <div className="flex items-center space-x-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < 4 ? "text-bookverse-highlight fill-bookverse-highlight" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">4.0</span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToLibrary(book, 'tbr')}
                          disabled={!!pendingActions[book.id]}
                        >
                          {pendingActions[book.id] === 'tbr' ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <PlusCircle className="mr-1 h-4 w-4" />
                          )}
                          TBR
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
                          onClick={() => addToLibrary(book, 'reading')}
                          disabled={!!pendingActions[book.id]}
                        >
                          {pendingActions[book.id] === 'reading' ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <BookOpen className="mr-1 h-4 w-4" />
                          )}
                          Read
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recently added section */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-bookverse-ink mb-1">Recently Added</h2>
              <p className="text-muted-foreground">The latest additions to our collection</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/books" className="flex items-center">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {recentBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden h-full book-card">
                <CardContent className="p-0">
                  <div className="flex flex-col h-full">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={book.coverUrl}
                        alt={`${book.title} by ${book.author}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-3 flex flex-col space-y-2">
                      <h3 className="font-medium truncate text-sm">{book.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
                      <div className="pt-1 flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 px-2"
                          onClick={() => addToLibrary(book, 'tbr')}
                          disabled={!!pendingActions[book.id]}
                        >
                          {pendingActions[book.id] === 'tbr' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <PlusCircle className="mr-1 h-3 w-3" />
                          )}
                          TBR
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight text-xs h-8 px-2"
                          onClick={() => addToLibrary(book, 'reading')}
                          disabled={!!pendingActions[book.id]}
                        >
                          {pendingActions[book.id] === 'reading' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <BookOpen className="mr-1 h-3 w-3" />
                          )}
                          Read
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats and trends section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-bookverse-ink mb-1">Stats & Trends</h2>
              <p className="text-muted-foreground">See what's popular in the BookVerse community</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/stats" className="flex items-center">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Trending Now</h3>
                  <TrendingUp className="h-5 w-5 text-bookverse-accent" />
                </div>
                <div className="space-y-3">
                  {mockBooks.slice(0, 3).map((book, index) => (
                    <div key={book.id} className="flex items-center">
                      <div className="font-bold text-muted-foreground mr-3">{index + 1}</div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">by {book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Most Read</h3>
                  <BookOpen className="h-5 w-5 text-bookverse-accent" />
                </div>
                <div className="space-y-3">
                  {mockBooks.slice(2, 5).map((book, index) => (
                    <div key={book.id} className="flex items-center">
                      <div className="font-bold text-muted-foreground mr-3">{index + 1}</div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">by {book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Recently Published</h3>
                  <Clock className="h-5 w-5 text-bookverse-accent" />
                </div>
                <div className="space-y-3">
                  {mockBooks.slice(3, 6).map((book) => (
                    <div key={book.id} className="flex items-center">
                      <div className="flex-1">
                        <p className="font-medium truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">by {book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
