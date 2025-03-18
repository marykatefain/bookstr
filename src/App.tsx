
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { initNostr } from "@/lib/nostr";
import Index from "./pages/Index";
import Books from "./pages/Books";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import BookDetail from "./pages/BookDetail";
import UserProfile from "./pages/UserProfile";
import SocialHub from "./pages/SocialHub";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize Nostr connection
    initNostr().then(user => {
      if (user) {
        console.log("Nostr user loaded:", user);
      } else {
        console.log("No Nostr user found, user needs to login");
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/books" element={<Books />} />
            <Route path="/book/:isbn" element={<BookDetail />} />
            <Route path="/library" element={<Profile />} />
            <Route path="/user/:pubkey" element={<UserProfile />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/social" element={<SocialHub />} />
            <Route path="/profile" element={<Navigate to="/library" replace />} /> {/* Redirect /profile to /library */}
            <Route path="/activity" element={<Navigate to="/social" replace />} />
            <Route path="/users" element={<Navigate to="/social" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
