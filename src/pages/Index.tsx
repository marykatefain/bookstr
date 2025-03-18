import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Book, LogIn, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { isLoggedIn } from "@/lib/nostr";
import { getTrendingBooks, getRecentBooks } from "@/lib/openlibrary";
import { useToast } from "@/components/ui/use-toast";
import { NostrLogin } from "@/components/NostrLogin";
import { Book as BookType } from "@/lib/nostr/types";
import { BookCard } from "@/components/BookCard";

const Index = () => {
  const { toast } = useToast();
  const [featuredBooks, setFeaturedBooks] = useState<BookType[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<BookType[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    // Load featured books
    const loadFeaturedBooks = async () => {
      setLoadingFeatured(true);
      try {
        const books = await getTrendingBooks(3);
        setFeaturedBooks(books);
      } catch (error) {
        console.error("Error loading featured books:", error);
        toast({
          title: "Error loading books",
          description: "There was a problem fetching featured books.",
          variant: "destructive"
        });
      } finally {
        setLoadingFeatured(false);
      }
    };

    // Load recent books
    const loadRecentBooks = async () => {
      setLoadingRecent(true);
      try {
        const books = await getRecentBooks(3);
        setRecentlyAdded(books);
      } catch (error) {
        console.error("Error loading recent books:", error);
        toast({
          title: "Error loading books",
          description: "There was a problem fetching recent books.",
          variant: "destructive"
        });
      } finally {
        setLoadingRecent(false);
      }
    };

    loadFeaturedBooks();
    loadRecentBooks();
  }, [toast]);

  const renderLoadingCard = () => (
    <div className="overflow-hidden h-full book-card">
      <div className="p-0">
        <div className="relative aspect-[2/3] bg-gray-200 animate-pulse"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          <div className="flex items-center space-x-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="pt-2 flex space-x-2">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

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
            
            {!isLoggedIn() && (
              <div className="w-full max-w-md mt-4">
                <NostrLogin />
              </div>
            )}
            
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
                    <Book className="mr-2 h-5 w-5" />
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
              {loadingFeatured ? (
                <>
                  {renderLoadingCard()}
                  {renderLoadingCard()}
                  {renderLoadingCard()}
                </>
              ) : (
                featuredBooks.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book}
                    showDescription={true}
                    size="medium"
                    onUpdate={() => loadFeaturedBooks()}
                  />
                ))
              )}
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
              {loadingRecent ? (
                <>
                  {renderLoadingCard()}
                  {renderLoadingCard()}
                  {renderLoadingCard()}
                </>
              ) : (
                recentlyAdded.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book}
                    showDescription={true}
                    size="medium"
                    onUpdate={() => loadRecentBooks()}
                  />
                ))
              )}
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
                Bookstr connects readers through the Nostr network, giving you full control over your data while building meaningful connections with fellow book lovers.
              </p>
              {!isLoggedIn() && (
                <div className="w-full max-w-md">
                  <NostrLogin />
                </div>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-2 -left-2 w-full h-full bg-bookverse-accent rounded-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-bookverse-highlight rounded-lg"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold font-serif mb-3">Why Bookstr?</h3>
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
