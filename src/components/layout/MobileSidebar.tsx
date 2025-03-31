
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Book, 
  Home, 
  Library, 
  BarChart2,
  LogOut,
  X,
  Search,
  Info,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NostrLoginButton } from "./NostrLoginButton";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  handleLogout: () => void;
}

export const MobileSidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  handleLogout 
}: MobileSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/library", label: "Library", icon: Library },
    { path: "/books", label: "Search", icon: Search },
    { path: "/stats", label: "Stats", icon: BarChart2 },
  ];

  const filteredLinks = navLinks.filter(() => true); // All links are shown now

  return (
    <aside
      className={`fixed inset-0 z-40 md:hidden transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="flex h-full">
        <div className="relative flex-1 flex flex-col w-80 max-w-sm bg-bookverse-paper shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Book className="h-6 w-6 text-bookverse-accent" />
              <h1 className="text-xl font-serif font-bold text-bookverse-ink">Bookstr</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-4">
            {user ? (
              <div className="space-y-3">
                <Link 
                  to={`/user/${user.pubkey}`} 
                  className="flex items-center space-x-3 p-3 hover:bg-bookverse-cream rounded-md transition-colors"
                  onClick={onClose}
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    <img
                      src={user.picture || "https://i.pravatar.cc/300"}
                      alt={user.name || "User"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || user.name || "Nostr User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.npub?.substring(0, 8)}...</p>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleLogout();
                    onClose();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <NostrLoginButton onLoginComplete={onClose} />
            )}
          </div>

          <Separator className="my-2" />

          <nav className="p-4 space-y-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm transition-colors ${
                  location.pathname === link.path
                    ? "bg-bookverse-cream text-bookverse-accent font-medium"
                    : "text-bookverse-ink hover:bg-bookverse-cream"
                }`}
                onClick={onClose}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          
          <Separator className="my-2" />
          
          <div className="px-4 pt-2 pb-2">
            <div className="space-y-4 p-3 bg-bookverse-cream/50 rounded-md">
              <h3 className="font-medium text-sm">What is Nostr?</h3>
              <p className="text-xs text-muted-foreground">
                Nostr is a decentralized protocol enabling censorship-resistant social networking and content sharing.
              </p>
              <Link
                to="/about"
                className="flex items-center space-x-2 text-xs text-bookverse-accent hover:text-bookverse-highlight"
                onClick={onClose}
              >
                <Info className="h-4 w-4" />
                <span>Learn more about Bookstr</span>
              </Link>
            </div>
          </div>
          
          <div className="px-4 pt-2 pb-4">
            <div className="space-y-4 p-3 bg-bookverse-cream/50 rounded-md">
              <h3 className="font-medium text-sm">Open Library Data</h3>
              <p className="text-xs text-muted-foreground">
                Bookstr uses Open Library's API for book data. Help improve the ecosystem by contributing missing book information.
              </p>
              <a
                href="https://openlibrary.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-xs text-bookverse-accent hover:text-bookverse-highlight"
              >
                <Database className="h-4 w-4" />
                <span>Visit Open Library</span>
              </a>
            </div>
          </div>
          
          <Separator className="my-2" />
        </div>
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={onClose}
          aria-hidden="true"
        ></div>
      </div>
    </aside>
  );
};
