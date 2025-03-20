
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, FileText, MessageCircle, Users } from "lucide-react";

interface UserProfileTabsProps {
  onTabChange: (value: string) => void;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({
  onTabChange,
}) => {
  return (
    <TabsList className="grid grid-cols-5 mb-6">
      <TabsTrigger value="posts" onClick={() => onTabChange("posts")}>
        <FileText className="mr-2 h-4 w-4" />
        Posts
      </TabsTrigger>
      <TabsTrigger value="reviews" onClick={() => onTabChange("reviews")}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Reviews
      </TabsTrigger>
      <TabsTrigger value="library" onClick={() => onTabChange("library")}>
        <Book className="mr-2 h-4 w-4" />
        Library
      </TabsTrigger>
      <TabsTrigger value="activity" onClick={() => onTabChange("activity")}>
        <Users className="mr-2 h-4 w-4" />
        Activity
      </TabsTrigger>
      <TabsTrigger value="about" onClick={() => onTabChange("about")}>
        About
      </TabsTrigger>
    </TabsList>
  );
};
