
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import About from "./pages/About";

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
            <Route path="/profile" element={<Profile />} />
            <Route path="/social" element={<Index />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/users" element={<UserSearch />} />
            <Route path="/users/:pubkey" element={<UserProfile />} />
            <Route path="/user/:pubkey" element={<UserProfile />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
