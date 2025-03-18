
import { useState } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchBookActivity } from "@/lib/nostr";
import { useQuery } from "@tanstack/react-query";

export const useBookActivity = (isbn: string | undefined) => {
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");

  const { 
    data: bookActivity = [], 
    isLoading: loadingActivity,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['bookActivity', isbn],
    queryFn: async () => {
      if (!isbn) return [];
      const activity = await fetchBookActivity(isbn);
      return activity;
    },
    enabled: !!isbn && activeTab === "activity",
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    retryDelay: 1000
  });

  // Change handler with optimizations
  const handleTabChange = (tab: "reviews" | "activity") => {
    if (tab === activeTab) return; // Prevent unnecessary state updates
    setActiveTab(tab);
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
    bookActivity,
    loadingActivity
  };
};
