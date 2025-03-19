import React from "react";
import { Link } from "react-router-dom";
import { Book, BookMarked, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/book/BookCover";
import { isLoggedIn } from "@/lib/nostr";
import { useLibraryData } from "@/hooks/use-library-data";
export const StatsSidebar = () => {
  const {
    user,
    books,
    booksLoading
  } = useLibraryData();
  const isUserLoggedIn = isLoggedIn();
  const currentlyReadingBooks = books.reading || [];
  return <aside className="hidden xl:block xl:w-64 border-l border-border bg-bookverse-paper dark:bg-gray-900 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Book className="h-6 w-6 text-bookverse-accent" />
        <h2 className="text-lg font-serif font-bold text-bookverse-ink">Your Reading</h2>
      </div>

      <Separator className="my-4" />

      {isUserLoggedIn ? <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <BookMarked className="h-5 w-5 text-bookverse-accent mb-1" />
                <div className="text-xl font-bold">{books.tbr.length}</div>
                <p className="text-xs text-muted-foreground">To Be Read</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <BookOpen className="h-5 w-5 text-bookverse-accent mb-1" />
                <div className="text-xl font-bold">{books.read.length}</div>
                <p className="text-xs text-muted-foreground">Read</p>
              </CardContent>
            </Card>
          </div>

          {currentlyReadingBooks.length > 0 && <div className="space-y-2">
              <h3 className="text-sm font-medium">Currently Reading</h3>
              
              <div className="space-y-4">
                {currentlyReadingBooks.map(book => <div key={book.id} className="rounded-lg overflow-hidden border border-border bg-card">
                    <div className="aspect-[2/3] w-full max-w-[120px] mx-auto my-3">
                      <BookCover isbn={book.isbn} title={book.title} author={book.author} coverUrl={book.coverUrl} />
                    </div>
                    <div className="p-3 pt-0 text-center">
                      <h4 className="font-medium text-sm line-clamp-1">{book.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                  </div>)}
              </div>
            </div>}

          <Link to="/library">
            <Button variant="outline" size="sm" className="w-full mx-0 my-[20px]">
              View Library
            </Button>
          </Link>
        </div> : <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your reading stats and progress</p>
          <Link to="/library">
            <Button variant="outline" size="sm" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>}
    </aside>;
};