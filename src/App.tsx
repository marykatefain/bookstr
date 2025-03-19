
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Page imports
import Index from "./pages/Index";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Library from "./pages/Library";
import Stats from "./pages/Stats";
import UserSearch from "./pages/UserSearch";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

// Service imports
import { initNostr } from "./lib/nostr";

// Create a react-query client
const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Initialize Nostr connection on app start
    initNostr();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/books" element={<Books />} />
            <Route path="/book/:isbn" element={<BookDetail />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Navigate to="/library" replace />} />
            <Route path="/social" element={<Navigate to="/" replace />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/users" element={<UserSearch />} />
            <Route path="/user/:pubkey" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
