
import { Link } from "react-router-dom";
import { Book, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  toggleMobileSidebar: () => void;
}

export const MobileHeader = ({ toggleMobileSidebar }: MobileHeaderProps) => {
  return (
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
          <Menu />
        </Button>
      </div>
    </header>
  );
};
