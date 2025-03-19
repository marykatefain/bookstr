
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, BookOpen, Book, FileText, MessageCircle } from "lucide-react";

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <TabsList className="grid grid-cols-5 mb-6">
      <TabsTrigger value="posts" onClick={() => setActiveTab("posts")}>
        <FileText className="mr-2 h-4 w-4" />
        Posts
      </TabsTrigger>
      <TabsTrigger value="reviews" onClick={() => setActiveTab("reviews")}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Reviews
      </TabsTrigger>
      <TabsTrigger value="tbr" onClick={() => setActiveTab("tbr")}>
        <BookMarked className="mr-2 h-4 w-4" />
        To Be Read
      </TabsTrigger>
      <TabsTrigger value="reading" onClick={() => setActiveTab("reading")}>
        <BookOpen className="mr-2 h-4 w-4" />
        Reading
      </TabsTrigger>
      <TabsTrigger value="read" onClick={() => setActiveTab("read")}>
        <Book className="mr-2 h-4 w-4" />
        Read
      </TabsTrigger>
    </TabsList>
  );
};
