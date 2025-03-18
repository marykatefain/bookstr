import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Book, 
  Home, 
  Library, 
  BarChart2, 
  User, 
  LogOut, 
  LogIn,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NostrLogin } from "@/components/NostrLogin";
import { 
  getCurrentUser, 
  isLoggedIn, 
  logoutNostr 
} from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const location = useLocation();

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);
  
  const handleLogout = () => {
    logoutNostr();
    setUser(null);
    toast({
      title: "Logged out successfully",
      description: "You have been logged out from Bookstr"
    });
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/books", label: "Discover", icon: Book },
    { path: "/library", label: "Library", icon: Library },
    { path: "/stats", label: "Stats", icon: BarChart2 },
    { path: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  const filteredLinks = navLinks.filter(
    link => !link.requiresAuth || (link.requiresAuth && isLoggedIn())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="md:hidden sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-900 p-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6 text-bookverse-accent" />
            <h1 className="text-xl font-serif font-bold text-bookverse-ink">Bookstr</h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            aria-label="Toggle navigation menu"
          >
            {mobileSidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
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
              <NostrLogin />
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

        <aside
          className={`fixed inset-0 z-40 md:hidden transform ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="flex h-full">
            <div className="relative flex-1 flex flex-col w-80 max-w-sm bg-bookverse-paper shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Book className="h-6 w-6 text-bookverse-accent" />
                  <h1 className="text-xl font-serif font-bold text-bookverse-ink">Bookstr</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-4">
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
                      onClick={() => {
                        handleLogout();
                        closeMobileSidebar();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <NostrLogin onLoginComplete={closeMobileSidebar} />
                )}
              </div>

              <Separator className="my-2" />

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm transition-colors ${
                      location.pathname === link.path
                        ? "bg-bookverse-cream text-bookverse-accent font-medium"
                        : "text-bookverse-ink hover:bg-bookverse-cream"
                    }`}
                    onClick={closeMobileSidebar}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div 
              className="flex-1 bg-black bg-opacity-50" 
              onClick={closeMobileSidebar}
              aria-hidden="true"
            ></div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
