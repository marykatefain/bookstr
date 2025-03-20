
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookMarked, BookCheck, Book, MessageCircle, FileText } from "lucide-react";

interface LibraryTabListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LibraryTabList: React.FC<LibraryTabListProps> = ({ activeTab, setActiveTab }) => {
  return (
    <TabsList className="w-full bg-transparent border-b rounded-none justify-between md:justify-start md:space-x-6 flex-wrap px-1">
      <TabsTrigger 
        value="books" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("books")}
      >
        <Book className="h-4 w-4" />
        All Books
        <div className={`${activeTab === "books" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="reading" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("reading")}
      >
        <BookOpen className="h-4 w-4" />
        Reading
        <div className={`${activeTab === "reading" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="tbr" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("tbr")}
      >
        <BookMarked className="h-4 w-4" />
        To Read
        <div className={`${activeTab === "tbr" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="read" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("read")}
      >
        <BookCheck className="h-4 w-4" />
        Read
        <div className={`${activeTab === "read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="reviews" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("reviews")}
      >
        <MessageCircle className="h-4 w-4" />
        Reviews
        <div className={`${activeTab === "reviews" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="posts" 
        className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
        onClick={() => setActiveTab("posts")}
      >
        <FileText className="h-4 w-4" />
        Posts
        <div className={`${activeTab === "posts" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
    </TabsList>
  );
};
