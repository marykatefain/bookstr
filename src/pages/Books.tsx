
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Book as BookIcon, 
  Star, 
  PlusCircle, 
  BookOpen, 
  Search, 
  Filter, 
  Loader2 
} from "lucide-react";
import { 
  mockBooks, 
  isLoggedIn, 
  addBookToTBR, 
  markBookAsReading, 
  Book 
} from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

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
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);
  const [pendingActions, setPendingActions] = useState<Record<string, string>>({});

  useEffect(() => {
    let results = books;
    
    // Filter by search query
    if (searchQuery) {
      results = results.filter(
        book => 
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (activeCategory !== "All") {
      results = results.filter(
        book => book.categories?.includes(activeCategory)
      );
    }
    
    setFilteredBooks(results);
  }, [searchQuery, activeCategory, books]);

  const addToLibrary = async (bookId: string, status: 'want-to-read' | 'reading') => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to add books to your library",
        variant: "destructive"
      });
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Set pending state for this book
    setPendingActions(prev => ({ ...prev, [bookId]: status }));

    try {
      let result: string | null;
      
      if (status === 'want-to-read') {
        result = await addBookToTBR(book);
      } else {
        result = await markBookAsReading(book);
      }

      if (result) {
        toast({
          title: `Added to your ${status === 'want-to-read' ? 'TBR' : 'currently reading'} list`,
          description: `${book.title} has been added to your library and published to Nostr`
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
        delete newState[bookId];
        return newState;
      });
    }
  };

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

          {/* Search and filters */}
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
                  {categories.slice(0, 5).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category.toLowerCase()}
                      className="whitespace-nowrap text-xs md:text-sm"
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="more" className="whitespace-nowrap text-xs md:text-sm">
                    <Filter className="h-4 w-4 mr-1" />
                    More
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Book grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.categories?.slice(0, 2).map((category) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <div className="pt-2 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToLibrary(book.id, 'want-to-read')}
                          disabled={!!pendingActions[book.id]}
                        >
                          {pendingActions[book.id] === 'want-to-read' ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <PlusCircle className="mr-1 h-4 w-4" />
                          )}
                          TBR
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-bookverse-accent hover:bg-bookverse-highlight"
                          onClick={() => addToLibrary(book.id, 'reading')}
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
                  </CardContent>
                </Card>
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
        </div>
      </div>
    </Layout>
  );
};

export default Books;
