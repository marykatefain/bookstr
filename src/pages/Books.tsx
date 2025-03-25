import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Book as BookIcon, Search, Loader2 } from "lucide-react";
import { Book } from "@/lib/nostr";
import { searchBooks, searchBooksByGenre } from "@/lib/openlibrary";
import { useToast } from "@/components/ui/use-toast";
import { BookCard } from "@/components/BookCard";
import { useWeeklyTrendingBooks } from "@/hooks/use-weekly-trending-books";
import { useLibraryData } from "@/hooks/use-library-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrendingQuery } from "@/hooks/feed";

const categories = [
  "All",
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Non-Fiction",
  "Biography",
  "History",
];

const Books = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { books: weeklyTrendingBooks, loading: loadingTrending } = useWeeklyTrendingBooks(20);
  const { getBookReadingStatus, refetchBooks: refetchUserBooks } = useLibraryData();
  const { fetchTrendingQuery } = useTrendingQuery(20);
  
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const initialRenderRef = useRef(true);
  const previousSearchRef = useRef({ query: "", category: "All" });
  const searchInProgressRef = useRef(false);
  const [popularBooksLoaded, setPopularBooksLoaded] = useState(false);
  const popularBooksLoadedRef = useRef(false);
  const trendingBookProcessingRef = useRef(false);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle search query debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
      debounceTimerRef.current = null;
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Enrich books with reading status
  const enrichBooksWithReadingStatus = useCallback((bookList: Book[]): Book[] => {
    return bookList.map(book => {
      if (book.isbn) {
        const readingStatus = getBookReadingStatus(book.isbn);
        if (readingStatus) {
          return {
            ...book,
            readingStatus: {
              ...book.readingStatus,
              status: readingStatus,
              dateAdded: Date.now()
            }
          };
        }
      }
      return book;
    }) as Book[];
  }, [getBookReadingStatus]);

  // Load popular books for the All tab, with better caching behavior
  useEffect(() => {
    const loadPopularBooks = async () => {
      // Only load popular books if on All tab with no search and not already loaded
      if (activeCategory === "All" && !debouncedSearch && !popularBooksLoadedRef.current && !isSearching) {
        console.log("Loading popular books for All tab");
        setIsLoading(true);
        
        try {
          const results = await fetchTrendingQuery();
          if (results.length > 0) {
            const enrichedResults = enrichBooksWithReadingStatus(results);
            setBooks(enrichedResults);
            setPopularBooksLoaded(true);
            popularBooksLoadedRef.current = true;
          } else if (weeklyTrendingBooks.length > 0 && !loadingTrending) {
            // Fall back to weekly trending if popular query fails
            const enrichedBooks = enrichBooksWithReadingStatus(weeklyTrendingBooks);
            setBooks(enrichedBooks);
            setPopularBooksLoaded(true);
            popularBooksLoadedRef.current = true;
          }
        } catch (error) {
          console.error("Error loading popular books:", error);
          if (weeklyTrendingBooks.length > 0 && !loadingTrending) {
            const enrichedBooks = enrichBooksWithReadingStatus(weeklyTrendingBooks);
            setBooks(enrichedBooks);
            setPopularBooksLoaded(true);
            popularBooksLoadedRef.current = true;
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadPopularBooks();
  }, [activeCategory, debouncedSearch, isSearching, fetchTrendingQuery, enrichBooksWithReadingStatus]);

  // Handle weekly trending books as fallback
  useEffect(() => {
    if (
      trendingBookProcessingRef.current || 
      popularBooksLoadedRef.current || 
      isSearching || 
      activeCategory !== "All" || 
      debouncedSearch || 
      weeklyTrendingBooks.length === 0 || 
      loadingTrending
    ) {
      return;
    }

    trendingBookProcessingRef.current = true;
    
    console.log("Setting trending books from hook:", weeklyTrendingBooks.length);
    const enrichedBooks = enrichBooksWithReadingStatus(weeklyTrendingBooks);
    setBooks(enrichedBooks);
    setIsLoading(false);
    setPopularBooksLoaded(true);
    popularBooksLoadedRef.current = true;
    
    setTimeout(() => {
      trendingBookProcessingRef.current = false;
    }, 50);
  }, [weeklyTrendingBooks, loadingTrending, enrichBooksWithReadingStatus]);

  // Handle search operations
  useEffect(() => {
    const performSearch = async () => {
      // Skip search if it's the same as the previous one
      if (
        debouncedSearch === previousSearchRef.current.query && 
        activeCategory === previousSearchRef.current.category
      ) {
        console.log("Skipping duplicate search");
        return;
      }
      
      // Prevent concurrent searches
      if (searchInProgressRef.current) {
        console.log("Search already in progress, skipping");
        return;
      }

      // If on All tab with no search, let the dedicated effect handle loading popular books
      if (!debouncedSearch && activeCategory === "All") {
        if (isSearching) {
          setIsSearching(false);
        }
        
        previousSearchRef.current = { query: debouncedSearch, category: activeCategory };
        return;
      }

      setIsSearching(true);
      // Only show loading if we don't already have books to display
      if (books.length === 0) {
        setIsLoading(true);
      }
      
      searchInProgressRef.current = true;
      
      try {
        let results: Book[] = [];
        
        if (debouncedSearch) {
          console.log(`Searching for books with query: "${debouncedSearch}"`);
          results = await searchBooks(debouncedSearch, 20);
        } else if (activeCategory !== "All") {
          console.log(`Searching for books in category: "${activeCategory}"`);
          results = await searchBooksByGenre(activeCategory, 20);
        }
        
        console.log(`Search returned ${results.length} results`);
        
        // Update previous search reference
        previousSearchRef.current = { query: debouncedSearch, category: activeCategory };
        
        if (results.length > 0) {
          const enrichedResults = enrichBooksWithReadingStatus(results);
          setBooks(enrichedResults);
        } else if (books.length === 0 && weeklyTrendingBooks.length > 0) {
          // Only use trending books as fallback if we have no results and no current books
          const enrichedBooks = enrichBooksWithReadingStatus(weeklyTrendingBooks);
          setBooks(enrichedBooks);
        }
      } catch (error) {
        console.error("Error searching books:", error);
        toast({
          title: "Error searching",
          description: "There was a problem with your search. Please try again.",
          variant: "destructive"
        });
        
        if (books.length === 0 && weeklyTrendingBooks.length > 0) {
          const enrichedBooks = enrichBooksWithReadingStatus(weeklyTrendingBooks);
          setBooks(enrichedBooks);
        }
      } finally {
        setIsLoading(false);
        searchInProgressRef.current = false;
      }
    };

    performSearch();
  }, [debouncedSearch, activeCategory, toast, enrichBooksWithReadingStatus]);

  // Handle category changes
  const handleCategoryChange = (category: string) => {
    // Skip if it's already the active category
    if (category === activeCategory) {
      console.log(`Category ${category} already active, skipping change`);
      return;
    }
    
    console.log(`Changing category to: ${category}`);
    setActiveCategory(category);
    
    // Reset popular books loaded state when changing categories
    if (category === "All") {
      setPopularBooksLoaded(false);
      popularBooksLoadedRef.current = false;
    }
    
    if (searchQuery) {
      setSearchQuery("");
      setDebouncedSearch("");
    }
  };

  // Handle book updates
  const handleBookUpdate = () => {
    console.log("Book updated, refreshing search results");
    refetchUserBooks();
    
    if (debouncedSearch || activeCategory !== "All") {
      // Only trigger a new search if we need to refresh the current results
      const currentSearch = debouncedSearch;
      // Force a refresh by briefly changing the state
      setDebouncedSearch("");
      setTimeout(() => {
        // Simulating a "force refresh" but prevent unnecessary searches
        previousSearchRef.current = { query: "", category: "" };
        setDebouncedSearch(currentSearch);
      }, 10);
    } else {
      // If we're on the All tab with no search, reset popular books loaded state to trigger reload
      setPopularBooksLoaded(false);
      popularBooksLoadedRef.current = false;
    }
  };

  const shouldShowLoadingSkeleton = (isLoading || loadingTrending) && 
    (books.length === 0 || (isSearching && books.length === 0));

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-bookverse-ink mb-2">Discover Books</h1>
            <p className="text-muted-foreground">
              Explore our curated collection and find your next favorite read
            </p>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or author"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 md:flex-none">
              <Tabs defaultValue="all" className="w-full md:w-auto">
                <TabsList className="w-full md:w-auto overflow-x-auto flex flex-nowrap justify-start px-1 h-auto py-1">
                  {categories.slice(0, 6).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category.toLowerCase()}
                      className="whitespace-nowrap text-xs md:text-sm"
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {shouldShowLoadingSkeleton ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-[220px] w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {books.length > 0 ? (
                books.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    showDescription={false}
                    size="medium"
                    onUpdate={handleBookUpdate}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <BookIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No books found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Books;
