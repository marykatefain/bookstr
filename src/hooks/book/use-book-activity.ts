
import { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchBookActivity } from "@/lib/nostr";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const useBookActivity = (isbn: string | undefined) => {
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");
  const { toast } = useToast();

  const { 
    data: bookActivity = [], 
    isLoading: loadingActivity,
    refetch: refetchActivity,
    error
  } = useQuery({
    queryKey: ['bookActivity', isbn],
    queryFn: async () => {
      if (!isbn) return [];
      console.log(`Fetching activity for book ISBN: ${isbn}`);
      try {
        const activity = await fetchBookActivity(isbn);
        console.log(`Retrieved ${activity.length} activities for book ISBN: ${isbn}`);
        return activity;
      } catch (err) {
        console.error(`Error fetching book activity for ISBN: ${isbn}:`, err);
        throw err;
      }
    },
    enabled: !!isbn && activeTab === "activity",
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    retryDelay: 1000
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching book activity:", error);
      toast({
        title: "Error",
        description: "Could not load book activity",
        variant: "destructive"
      });
    }
  }, [error, toast]);

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
