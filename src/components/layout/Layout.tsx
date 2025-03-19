
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { getCurrentUser, logoutNostr } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export const Layout = ({ children, rightSidebar }: LayoutProps) => {
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

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader toggleMobileSidebar={toggleMobileSidebar} />

      <div className="flex flex-1">
        <Sidebar 
          user={user} 
          handleLogout={handleLogout} 
        />

        <MobileSidebar 
          isOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
          user={user}
          handleLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-xl mx-auto xl:px-4 xl:flex xl:gap-6">
            <div className="flex-1">{children}</div>
            {rightSidebar && (
              <div className="hidden xl:block w-80 flex-shrink-0 py-8">
                {rightSidebar}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
