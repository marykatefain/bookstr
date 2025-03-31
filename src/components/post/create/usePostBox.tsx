import { useState, useRef, useEffect, useMemo } from "react";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { createBookPost, isLoggedIn, getCurrentUser, fetchUserBooks } from "@/lib/nostr";
import { searchBooks } from "@/lib/openlibrary/search";

interface UsePostBoxResult {
  content: string;
  setContent: (content: string) => void;
  selectedBook: Book | null;
  setSelectedBook: (book: Book | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Book[];
  searching: boolean;
  mediaPreview: string | null;
  mediaFile: File | null;
  mediaType: "image" | "video" | null;
  isSpoiler: boolean;
  setIsSpoiler: (value: boolean) => void;
  posting: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
  userBooks: Book[];
  loadingUserBooks: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showISBNModal: boolean;
  setShowISBNModal: (value: boolean) => void;
  pendingBook: Book | null;
  setPendingBook: (book: Book | null) => void;
  handleSearch: () => Promise<void>;
  handleSelectBook: (book: Book) => void;
  handleMediaUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearMedia: () => void;
  handleSubmit: () => Promise<void>;
  user: any;
}

interface UsePostBoxProps {
  onPostSuccess?: () => void;
}

// Named export function
export function usePostBox(props: UsePostBoxProps = {}): UsePostBoxResult {
  const { onPostSuccess } = props;
  
  const [content, setContent] = useState("#bookstr ");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pendingBook, setPendingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [showISBNModal, setShowISBNModal] = useState(false);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loadingUserBooks, setLoadingUserBooks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    if (isLoggedIn() && user) {
      loadUserBooks();
    }
  }, [user]);

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
      if (!user || !user.pubkey) return;
      
      const books = await fetchUserBooks(user.pubkey);
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
      console.log("Search returned results:", results.length, results);
      
      if (results && Array.isArray(results)) {
        setSearchResults(results);
      } else {
        console.error("Invalid search results format:", results);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching books:", error);
      toast({
        title: "Search error",
        description: "Could not search for books",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    console.log("Selected book:", book);
    if (!book.isbn) {
      setPendingBook(book);
      setShowISBNModal(true);
    } else {
      setSelectedBook(book);
      setOpen(false);
    }
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

  return {
    content,
    setContent,
    selectedBook,
    setSelectedBook,
    pendingBook,
    setPendingBook,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    mediaPreview,
    mediaFile,
    mediaType,
    isSpoiler,
    setIsSpoiler,
    posting,
    open,
    setOpen,
    showISBNModal,
    setShowISBNModal,
    userBooks,
    loadingUserBooks,
    fileInputRef,
    handleSearch,
    handleSelectBook,
    handleMediaUpload,
    clearMedia,
    handleSubmit,
    user
  };
}

// Default export for backwards compatibility
export default usePostBox;