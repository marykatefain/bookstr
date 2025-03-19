import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Book, 
  Home, 
  Library, 
  BarChart2,
  LogOut,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  getCurrentUser, 
  isLoggedIn
} from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { NostrLoginButton } from "./NostrLoginButton";

interface SidebarProps {
  user: any;
  handleLogout: () => void;
}

export const Sidebar = ({ user, handleLogout }: SidebarProps) => {
  const location = useLocation();
  
  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/library", label: "Library", icon: Library },
    { path: "/books", label: "Search", icon: Search },
    { path: "/stats", label: "Stats", icon: BarChart2 },
  ];

  const filteredLinks = navLinks.filter(() => true); // All links are shown now since we removed requiresAuth

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-bookverse-paper dark:bg-gray-900 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Book className="h-6 w-6 text-bookverse-accent" />
        <h1 className="text-xl font-serif font-bold text-bookverse-ink">Bookstr</h1>
      </div>
      
      <div className="mb-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3">
              <div className="h-8 w-8 rounded-full overflow-hidden">
                <img
                  src={user.picture || "https://i.pravatar.cc/300"}
                  alt={user.name || "User"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.display_name || "Nostr User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.npub?.substring(0, 8)}...</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <NostrLoginButton />
        )}
      </div>

      <Separator className="my-4" />

      <nav className="flex-1 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === link.path
                ? "bg-bookverse-cream text-bookverse-accent font-medium"
                : "text-bookverse-ink hover:bg-bookverse-cream"
            }`}
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
