
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const BookDetailSkeleton: React.FC = () => {
  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="md:w-2/3 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
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
