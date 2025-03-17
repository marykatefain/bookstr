
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Book, Star, PlusCircle, Bookmark, BookOpen, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { mockBooks, getCurrentUser, isLoggedIn } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [featuredBooks, setFeaturedBooks] = useState(mockBooks.slice(0, 3));
  const [recentlyAdded, setRecentlyAdded] = useState(mockBooks.slice(3, 6));

  const addToLibrary = (bookId: string, status: 'want-to-read' | 'reading') => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to add books to your library",
        variant: "destructive"
      });
      return;
    }

    const book = mockBooks.find(b => b.id === bookId);
    if (!book) return;

    toast({
      title: `Added to your ${status === 'want-to-read' ? 'want to read' : 'currently reading'} list`,
      description: `${book.title} has been added to your library`
    });
  };

  return (
    <Layout>
      {/* Hero section */}
      <section className="relative py-16 bg-gradient-to-b from-bookverse-paper to-bookverse-cream">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-bookverse-ink">
                Your Reading Journey, Decentralized
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto">
                Discover, track, and share your reading journey on the Nostr network. Take control of your book data.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/books">
                <Button size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                  <Book className="mr-2 h-5 w-5" />
                  Discover Books
                </Button>
              </Link>
              {!isLoggedIn() && (
                <Link to="/library">
                  <Button size="lg" variant="outline">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Start Your Library
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-serif text-bookverse-ink">Featured Books</h2>
              <Link to="/books" className="text-sm text-bookverse-accent hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden h-full book-card">
                  <CardContent className="p-0">
                    <div className="relative aspect-[2/3] book-cover">
                      <img
                        src={book.coverUrl}
                        alt={`${book.title} by ${book.author}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold font-serif truncate">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">by {book.author}</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < 4 ? "text-bookverse-highlight fill-bookverse-highlight" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">4.0</span>
                      </div>
                      <p className="text-sm line-clamp-2">{book.description}</p>
                      <div className="pt-2 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToLibrary(book.id, 'want-to-read')}
                        >
                          <PlusCircle className="mr-1 h-4 w-4" />
                          Want to Read
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Recently Added */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-serif text-bookverse-ink">Recently Added</h2>
              <Link to="/books" className="text-sm text-bookverse-accent hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentlyAdded.map((book) => (
                <Card key={book.id} className="overflow-hidden h-full book-card">
                  <CardContent className="p-0">
                    <div className="relative aspect-[2/3] book-cover">
                      <img
                        src={book.coverUrl}
                        alt={`${book.title} by ${book.author}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold font-serif truncate">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">by {book.author}</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < 3 ? "text-bookverse-highlight fill-bookverse-highlight" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">3.0</span>
                      </div>
                      <p className="text-sm line-clamp-2">{book.description}</p>
                      <div className="pt-2 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToLibrary(book.id, 'want-to-read')}
                        >
                          <Bookmark className="mr-1 h-4 w-4" />
                          Want to Read
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
                          onClick={() => addToLibrary(book.id, 'reading')}
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
          </div>
        </div>
      </section>

      {/* Join the community */}
      <section className="py-12 bg-bookverse-cream">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4 md:w-1/2">
              <h2 className="text-3xl font-bold font-serif text-bookverse-ink">Join the decentralized reading community</h2>
              <p className="text-muted-foreground">
                BookVerse connects readers through the Nostr network, giving you full control over your data while building meaningful connections with fellow book lovers.
              </p>
              {!isLoggedIn() && (
                <Button size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in with Nostr
                </Button>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-2 -left-2 w-full h-full bg-bookverse-accent rounded-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-bookverse-highlight rounded-lg"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold font-serif mb-3">Why BookVerse?</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                      <span>Own your reading data on the Nostr network</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                      <span>Connect with other readers without algorithms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                      <span>Track your reading journey your way</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                      <span>No ads, no tracking, no data harvesting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
