
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { ReactionProvider } from "@/contexts/ReactionContext";

// Page imports
import Index from "./pages/Index";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import ReviewDetail from "./pages/ReviewDetail";
import PostDetail from "./pages/PostDetail";
import Library from "./pages/Library";
import Stats from "./pages/Stats";
import UserSearch from "./pages/UserSearch";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Following from "./pages/Following";
import NotificationsPage from "./pages/NotificationsPage";

// Service imports
import { initNostr, cleanupNostr } from "./lib/nostr";

// Create a react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize Nostr connection on app start
    initNostr();
    
    // Cleanup Nostr connection on app unmount
    return () => {
      cleanupNostr();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <ReactionProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/books" element={<Books />} />
              <Route path="/book/:isbn" element={<BookDetail />} />
              <Route path="/review/:reviewId" element={<ReviewDetail />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Navigate to="/library" replace />} />
              <Route path="/social" element={<Index />} />
              <Route path="/following" element={<Following />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/users" element={<UserSearch />} />
              <Route path="/users/:pubkey" element={<UserProfile />} />
              <Route path="/user/:pubkey" element={<UserProfile />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </ReactionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
