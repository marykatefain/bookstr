
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Users } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold mb-4 text-bookverse-ink">404</h1>
          <p className="text-xl text-gray-600 mb-8">
            Oops! We couldn't find the page you're looking for.
          </p>
          
          <p className="text-muted-foreground mb-8">
            The page "{location.pathname}" doesn't seem to exist.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="gap-2">
              <Link to="/books">
                <BookOpen className="h-4 w-4" />
                Books
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="gap-2">
              <Link to="/users">
                <Users className="h-4 w-4" />
                Users
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
