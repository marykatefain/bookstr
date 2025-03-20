
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Book, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NostrLogin } from "@/components/NostrLogin";
import { isLoggedIn } from "@/lib/nostr";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";
import { BookCard } from "@/components/BookCard";

export function HeroSection() {
  const { books, loading, refreshBooks } = useWeeklyTrendingBooks(5);
  
  useEffect(() => {
    // Force refresh books when component mounts to ensure data is loaded
    refreshBooks();
    console.log("HeroSection: Refreshing trending books");
  }, [refreshBooks]);
  
  useEffect(() => {
    // Log books data for debugging
    console.log("HeroSection trending books:", { loading, booksCount: books.length, books });
  }, [books, loading]);
  
  return (
    <section className="relative py-16 bg-gradient-to-b from-bookverse-paper to-bookverse-cream">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-bookverse-ink">Escape the Algorithm, Embrace the Story.</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto">Discover, track, and share your reading journey on the decentralized Nostr network. No corporations. No ads. No data tracking. Just books.</p>
          </div>
          
          {!isLoggedIn() && (
            <div className="w-full max-w-md mt-4">
              <NostrLogin />
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4">
            {isLoggedIn() ? (
              <>
                <Link to="/books">
                  <Button size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                    <Book className="mr-2 h-5 w-5" />
                    Discover Books
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button size="lg" variant="outline">
                    <Book className="mr-2 h-5 w-5" />
                    Your Library
                  </Button>
                </Link>
              </>
            ) : (
              <></>
            )}
          </div>
          
          {/* Weekly Trending Books - Only shown when logged out */}
          {!isLoggedIn() && (
            <div className="w-full max-w-5xl mt-8">
              <h2 className="text-xl md:text-2xl font-bold font-serif text-bookverse-ink mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-bookverse-accent" />
                Weekly Trending Books
              </h2>
              
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-gray-200 animate-pulse rounded-md"></div>
                  ))}
                </div>
              ) : books.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {books.slice(0, 5).map((book) => (
                    <Link to={`/book/${book.isbn || book.id}`} key={book.id}>
                      <BookCard 
                        book={book}
                        size="small"
                        showDescription={false}
                        className="h-full hover:shadow-md transition-shadow"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-100 rounded-lg">
                  <p>No trending books available. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
