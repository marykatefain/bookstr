
import { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { fetchBookActivity } from "@/lib/nostr";

export const useBookActivity = (isbn: string | undefined) => {
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");
  const [bookActivity, setBookActivity] = useState<SocialActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!isbn || activeTab !== "activity") return;
      
      setLoadingActivity(true);
      try {
        const activity = await fetchBookActivity(isbn);
        setBookActivity(activity);
      } catch (error) {
        console.error("Error fetching community activity:", error);
      } finally {
        setLoadingActivity(false);
      }
    };
    
    fetchActivity();
  }, [isbn, activeTab]);

  return {
    activeTab,
    setActiveTab,
    bookActivity,
    loadingActivity
  };
};
