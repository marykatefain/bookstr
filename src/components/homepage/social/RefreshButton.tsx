
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function RefreshButton({ onRefresh, isRefreshing }: RefreshButtonProps) {
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="flex-shrink-0"
      title="Refresh feed"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
}
