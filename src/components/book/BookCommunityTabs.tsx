
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users } from "lucide-react";

interface BookCommunityTabsProps {
  activeTab: string;
  setActiveTab: (tab: "reviews" | "activity") => void;
  reviewsCount: number;
}

export const BookCommunityTabs: React.FC<BookCommunityTabsProps> = ({
  activeTab,
  setActiveTab,
  reviewsCount
}) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-medium">Community</h3>
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "reviews" | "activity")}
        className="w-auto"
      >
        <TabsList>
          <TabsTrigger value="reviews" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>Reviews{reviewsCount > 0 ? ` (${reviewsCount})` : ""}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
