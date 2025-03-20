
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { SocialFeed } from "@/components/SocialFeed";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { ActivityStream } from "lucide-react";
import { useActivityFeed } from "@/hooks/use-activity-feed";

export default function ActivityFeed() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  const { 
    activities,
    loading,
    error,
    refreshFeed,
    totalPages
  } = useActivityFeed({
    page,
    itemsPerPage
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-serif text-bookverse-ink flex items-center">
            <ActivityStream className="mr-2 h-7 w-7 text-bookverse-accent" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-2">
            Recent book activities from the Nostr community
          </p>
        </div>

        <div className="mb-8">
          <SocialFeed 
            activities={activities}
            type="global" 
            maxItems={itemsPerPage}
            isBackgroundRefresh={false}
            onRefreshComplete={() => console.log("Feed refresh complete")}
          />
        </div>

        {totalPages > 1 && (
          <Pagination className="my-8">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                </PaginationItem>
              )}
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show current page, first, last, and pages around current
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        isActive={page === pageNum}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNum === 2 && page > 3) || 
                  (pageNum === totalPages - 1 && page < totalPages - 2)
                ) {
                  return <PaginationItem key={pageNum}>...</PaginationItem>;
                }
                return null;
              })}
              
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Layout>
  );
}
