
import React from "react";
import { Button } from "@/components/ui/button";
import { Book as BookIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BookCover } from "@/components/book/BookCover";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/lib/nostr/types";
import { ISBNEntryModal } from "@/components/ISBNEntryModal";

interface BookSelectorProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searching: boolean;
  searchResults: Book[];
  selectedBook: Book | null;
  setSelectedBook: (book: Book | null) => void;
  userBooks: Book[];
  loadingUserBooks: boolean;
  handleSelectBook: (book: Book) => void;
  pendingBook: Book | null;
  showISBNModal: boolean;
  setShowISBNModal: (value: boolean) => void;
}

export function BookSelector({
  open,
  setOpen,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  selectedBook,
  setSelectedBook,
  userBooks,
  loadingUserBooks,
  handleSelectBook,
  pendingBook,
  showISBNModal,
  setShowISBNModal
}: BookSelectorProps) {
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <BookIcon className="mr-2 h-4 w-4" />
            <span>{selectedBook ? "Change Book" : "Tag Book"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" side="top">
          <Command>
            <CommandInput 
              placeholder="Search for a book..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              {searchQuery.trim().length < 2 && userBooks.length > 0 && (
                <CommandGroup heading="Your Books">
                  {loadingUserBooks ? (
                    <div className="p-2">
                      <Skeleton className="h-10 w-full mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : userBooks.length > 0 ? (
                    userBooks.map((book) => (
                      <CommandItem
                        key={book.id}
                        onSelect={() => handleSelectBook(book)}
                        className="flex items-center gap-2"
                      >
                        <div className="w-8 h-12 flex-shrink-0">
                          <BookCover 
                            coverUrl={book.coverUrl} 
                            title={book.title} 
                            size="xxsmall" 
                          />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                      </CommandItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No books in your library
                    </div>
                  )}
                </CommandGroup>
              )}
              
              {searchQuery.trim().length >= 2 && (
                <CommandGroup heading="Search Results">
                  {searching ? (
                    <div className="p-2">
                      <Skeleton className="h-10 w-full mb-2" />
                      <Skeleton className="h-10 w-full mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-6 text-center">
                      <p>No books found.</p>
                      <p className="text-sm text-muted-foreground">Try a different search term.</p>
                    </div>
                  ) : (
                    searchResults.map((book, index) => (
                      <CommandItem
                        key={book.id || `${book.title}-${book.author}-${index}`}
                        onSelect={() => handleSelectBook(book)}
                        className="flex items-center gap-2 py-2"
                        value={`${book.title} ${book.author}`}
                      >
                        <div className="w-8 h-12 flex-shrink-0">
                          <BookCover 
                            coverUrl={book.coverUrl} 
                            title={book.title} 
                            size="xxsmall" 
                          />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedBook && (
        <div className="flex items-start gap-3 p-3 bg-muted rounded-md relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => setSelectedBook(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-shrink-0 w-12">
            <BookCover 
              coverUrl={selectedBook.coverUrl} 
              title={selectedBook.title} 
              size="xsmall" 
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{selectedBook.title}</p>
            <p className="text-xs text-muted-foreground">{selectedBook.author}</p>
          </div>
        </div>
      )}

      {pendingBook && (
        <ISBNEntryModal
          book={pendingBook}
          isOpen={showISBNModal}
          onClose={() => setShowISBNModal(false)}
          onSubmit={() => {}} // No longer needed but kept for type compatibility
        />
      )}
    </>
  );
}
