
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[150px] w-full" />
      <Skeleton className="h-[150px] w-full" />
      <Skeleton className="h-[150px] w-full" />
    </div>
  );
}
