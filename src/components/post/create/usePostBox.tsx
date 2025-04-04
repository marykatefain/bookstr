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
  mediaAltText: string;
  setMediaAltText: (text: string) => void;
  mediaUrl: string | null;
  mediaService: string | null;
  uploadProgress: number;
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
  showAltTextModal: boolean;
  setShowAltTextModal: (value: boolean) => void;
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
  const [mediaAltText, setMediaAltText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaService, setMediaService] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [showISBNModal, setShowISBNModal] = useState(false);
  const [showAltTextModal, setShowAltTextModal] = useState(false);
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

  // Show alt text modal when media is uploaded for accessibility
  useEffect(() => {
    if (mediaFile && mediaType === 'image' && !mediaAltText) {
      setShowAltTextModal(true);
    }
  }, [mediaFile, mediaType]);

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

    // Reset media related states when uploading a new image
    setMediaAltText('');
    setUploadProgress(0);
    setMediaUrl(null);
    setMediaService(null);

    // Check file size (10MB max for uploads)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
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
    setMediaAltText('');
    setMediaUrl(null);
    setMediaService(null);
    setUploadProgress(0);
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

    // If it's an image and no alt text, encourage adding it
    if (mediaType === 'image' && mediaFile && !mediaAltText.trim()) {
      setShowAltTextModal(true);
      return;
    }

    setPosting(true);
    try {
      // Extract service from imeta tag if present
      const extractService = (url: string) => {
        // Common known services by URL pattern
        if (url.includes('nostr.build')) return 'Nostr.build';
        if (url.includes('void.cat')) return 'Void.cat';
        if (url.includes('blossom.band')) return 'Blossom';
        if (url.includes('nostrimg.com')) return 'NostrImg';
        // Default to "Unknown service"
        return 'a media hosting service';
      };

      const result = await createBookPost({
        content: content.trim(),
        book: selectedBook,
        mediaFile,
        mediaType,
        isSpoiler,
        altText: mediaAltText,
        onMediaUploadProgress: (progress) => {
          setUploadProgress(progress);
          // When upload is complete, reset progress after a delay
          if (progress === 100) {
            setTimeout(() => setUploadProgress(0), 1000);
          }
        }
      });

      if (result.success) {
        // Store the media URL if available
        if (result.mediaUrl) {
          setMediaUrl(result.mediaUrl);
          // Determine the service from the URL
          setMediaService(extractService(result.mediaUrl));
        }
        
        toast({
          title: "Post created",
          description: "Your post has been published"
        });
        
        // Clear form after successful post, but keep the media preview if available
        // so the user can see the post they just created
        setContent("#bookstr ");
        setSelectedBook(null);
        setIsSpoiler(false);
        
        // Only trigger the refresh callback
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
    mediaAltText,
    setMediaAltText,
    mediaUrl,
    mediaService,
    uploadProgress,
    isSpoiler,
    setIsSpoiler,
    posting,
    open,
    setOpen,
    showISBNModal,
    setShowISBNModal,
    showAltTextModal,
    setShowAltTextModal,
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