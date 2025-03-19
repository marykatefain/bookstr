
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryTabListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LibraryTabList: React.FC<LibraryTabListProps> = ({ activeTab, setActiveTab }) => {
  return (
    <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-4 flex-wrap">
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
        All Books
        <div className={`${activeTab === "books" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="reading" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        onClick={() => setActiveTab("reading")}
      >
        Currently Reading
        <div className={`${activeTab === "reading" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="tbr" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        onClick={() => setActiveTab("tbr")}
      >
        Want to Read
        <div className={`${activeTab === "tbr" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="read" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        onClick={() => setActiveTab("read")}
      >
        Read
        <div className={`${activeTab === "read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
    </TabsList>
  );
};
