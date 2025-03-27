
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface BookDetailSkeletonProps {
  title?: string;
  author?: string;
  partialData?: boolean;
}

export const BookDetailSkeleton: React.FC<BookDetailSkeletonProps> = ({ 
  title, 
  author, 
  partialData = false 
}) => {
  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse">
            {partialData && (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center p-4">
                  {title && <p className="font-medium text-gray-600">{title}</p>}
                  {author && <p className="text-sm text-gray-500 mt-1">{author}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="md:w-2/3 space-y-4">
          {title ? (
            <h1 className="text-3xl font-bold text-bookverse-ink">{title}</h1>
          ) : (
            <Skeleton className="h-10 w-3/4" />
          )}
          
          {author ? (
            <h2 className="text-xl text-muted-foreground">{author}</h2>
          ) : (
            <Skeleton className="h-6 w-1/2" />
          )}
          
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
};
