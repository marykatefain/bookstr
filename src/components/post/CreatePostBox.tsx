
import React, { useState, useRef, useEffect } from "react";
import { Book, Post } from "@/lib/nostr/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BookCover } from "@/components/book/BookCover";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { createBookPost, isLoggedIn, getCurrentUser } from "@/lib/nostr";
import { searchBooks } from "@/lib/openlibrary/search";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Book as BookIcon, ImageIcon, VideoIcon, X, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchUserBooks } from "@/lib/nostr";

interface CreatePostBoxProps {
  onPostSuccess?: () => void;
}

export function CreatePostBox({ onPostSuccess }: CreatePostBoxProps) {
  const [content, setContent] = useState("#bookstr ");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loadingUserBooks, setLoadingUserBooks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const user = getCurrentUser();

  useEffect(() => {
    if (isLoggedIn() && user) {
      loadUserBooks();
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadUserBooks = async () => {
    setLoadingUserBooks(true);
    try {
      const books = await fetchUserBooks(user!.pubkey);
      const allBooks = [
        ...books.reading,
        ...books.tbr,
        ...books.read
      ];
      setUserBooks(allBooks);
    } catch (error) {
      console.error("Error loading user books:", error);
    } finally {
      setLoadingUserBooks(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setSearching(true);
    setSearchResults([]); // Clear old results while searching
    
    try {
      console.log("Searching for books with query:", searchQuery);
      const results = await searchBooks(searchQuery, 10);
      console.log("Search returned results:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching books:", error);
      toast({
        title: "Search error",
        description: "Could not search for books",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setOpen(false);
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
      setMediaFile(file);
      setMediaType(fileType as "image" | "video");
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaFile(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to create posts",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim() && !selectedBook) {
      toast({
        title: "Empty post",
        description: "Please write something or select a book",
        variant: "destructive"
      });
      return;
    }

    setPosting(true);
    try {
      const success = await createBookPost({
        content: content.trim(),
        book: selectedBook,
        mediaFile,
        mediaType,
        isSpoiler
      });

      if (success) {
        toast({
          title: "Post created",
          description: "Your post has been published"
        });
        setContent("#bookstr ");
        setSelectedBook(null);
        clearMedia();
        setIsSpoiler(false);
        
        if (onPostSuccess) {
          onPostSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Could not create post",
        variant: "destructive"
      });
    } finally {
      setPosting(false);
    }
  };

  if (!isLoggedIn()) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Please sign in to create posts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.name?.[0] || user?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What are you reading?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={3}
            />
            
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
            
            {mediaPreview && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white z-10"
                  onClick={clearMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
                {mediaType === 'image' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="max-h-60 rounded-md object-contain mx-auto" 
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="max-h-60 rounded-md w-full" 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-wrap gap-2 px-6 py-4 border-t">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <BookIcon className="mr-2 h-4 w-4" />
                <span>{selectedBook ? "Change Book" : "Tag Book"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search for a book..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {searchQuery.trim().length < 2 && userBooks.length > 0 && (
                    <CommandGroup heading="Your Books">
                      {loadingUserBooks ? (
                        <div className="p-2">
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : (
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
                      )}
                    </CommandGroup>
                  )}
                  
                  {searchQuery.trim().length >= 2 && (
                    <CommandGroup heading="Search Results">
                      {searching ? (
                        <div className="p-2">
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <CommandEmpty>No books found. Try a different search term.</CommandEmpty>
                      ) : (
                        searchResults.map((book) => (
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
                      )}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleMediaUpload}
          />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => fileInputRef.current?.click()}
          >
            {mediaType === 'video' ? (
              <VideoIcon className="mr-2 h-4 w-4" />
            ) : (
              <ImageIcon className="mr-2 h-4 w-4" />
            )}
            <span>Add Media</span>
          </Button>
          
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center space-x-2">
              <Switch
                id="spoiler"
                checked={isSpoiler}
                onCheckedChange={setIsSpoiler}
              />
              <Label htmlFor="spoiler" className="flex items-center cursor-pointer">
                <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500" />
                <span className="text-sm">Spoiler</span>
              </Label>
            </div>
          </div>
        </div>
        
        <Button 
          className="ml-auto mt-2 sm:mt-0" 
          disabled={posting || (!content.trim() && !selectedBook)}
          onClick={handleSubmit}
        >
          {posting ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
