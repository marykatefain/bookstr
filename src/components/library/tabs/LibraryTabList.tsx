
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryTabListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LibraryTabList: React.FC<LibraryTabListProps> = ({ activeTab, setActiveTab }) => {
  return (
    <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-8">
      <TabsTrigger 
        value="posts" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        onClick={() => setActiveTab("posts")}
      >
        My Posts
        <div className={`${activeTab === "posts" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="books" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        onClick={() => setActiveTab("books")}
      >
        My Books
        <div className={`${activeTab === "books" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
    </TabsList>
  );
};
