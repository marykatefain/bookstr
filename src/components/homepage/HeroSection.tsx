
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Book, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NostrLogin } from "@/components/NostrLogin";
import { isLoggedIn } from "@/lib/nostr";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

export function HeroSection() {
  const { books, loading, refreshBooks } = useWeeklyTrendingBooks(10); // Changed to fetch 10 books
  
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
            {isLoggedIn() && (
              <>
                <Link to="/books">
                  <Button size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                    <Book className="mr-2 h-5 w-5" />
                    Discover Books
                  </Button>
                </Link>
                <Link to="/library">
                  <Button size="lg" variant="outline">
                    <Book className="mr-2 h-5 w-5" />
                    Your Library
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Weekly Trending Books - Only shown when logged out */}
          {!isLoggedIn() && (
            <div className="w-full max-w-6xl mt-8">
              <h2 className="text-xl md:text-2xl font-bold font-serif text-bookverse-ink mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-bookverse-accent" />
                Weekly Trending Books
              </h2>
              
              {loading ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {[...Array(10)].map((_, i) => (
                        <CarouselItem key={i} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                          <div className="p-1 h-full">
                            <div className="flex flex-col h-full rounded-md overflow-hidden">
                              <Skeleton className="aspect-[2/3] w-full h-full" />
                              <Skeleton className="h-6 w-full mt-2" />
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-1 lg:left-2" />
                    <CarouselNext className="right-1 lg:right-2" />
                  </Carousel>
                </div>
              ) : books.length > 0 ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {books.map((book) => (
                        <CarouselItem key={book.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                          <Link to={`/book/${book.isbn || book.id}`} className="block h-full">
                            <div className="p-1 h-full">
                              <BookCoverOnly 
                                book={book}
                                className="h-full rounded-md overflow-hidden hover:shadow-md transition-shadow"
                              />
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-1 lg:left-2" />
                    <CarouselNext className="right-1 lg:right-2" />
                  </Carousel>
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

// A simplified version of BookCard that only shows the cover and title
// This removes all action buttons as requested
function BookCoverOnly({ book, className = "" }) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="relative flex-grow">
        <img
          src={book.coverUrl || `${API_BASE_URL}/covers.openlibrary.org/b/isbn/placeholder-L.jpg`}
          alt={book.title}
          className="object-cover w-full h-full rounded-md"
          onError={(e) => {
            e.currentTarget.src = `${API_BASE_URL}/covers.openlibrary.org/b/isbn/placeholder-L.jpg`;
          }}
        />
      </div>
      <div className="p-2 text-center">
        <h3 className="text-sm font-medium truncate" title={book.title}>
          {book.title}
        </h3>
      </div>
    </div>
  );
}
