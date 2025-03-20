import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookMarked, BookCheck, Book, MessageCircle, FileText } from "lucide-react";
interface LibraryTabListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
export const LibraryTabList: React.FC<LibraryTabListProps> = ({
  activeTab,
  setActiveTab
}) => {
  return <TabsList className="w-full bg-transparent border-b rounded-none justify-between md:justify-start md:space-x-6 flex-wrap px-[21px] py-[6px]">
      <TabsTrigger value="books" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("books")}>
        <Book className={`h-4 w-4 ${activeTab === "books" ? "text-bookverse-accent" : ""}`} />
        All Books
        <div className={`${activeTab === "books" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger value="reading" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("reading")}>
        <BookOpen className={`h-4 w-4 ${activeTab === "reading" ? "text-bookverse-accent" : ""}`} />
        Reading
        <div className={`${activeTab === "reading" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger value="tbr" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("tbr")}>
        <BookMarked className={`h-4 w-4 ${activeTab === "tbr" ? "text-bookverse-accent" : ""}`} />
        To Read
        <div className={`${activeTab === "tbr" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger value="read" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("read")}>
        <BookCheck className={`h-4 w-4 ${activeTab === "read" ? "text-bookverse-accent" : ""}`} />
        Read
        <div className={`${activeTab === "read" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger value="reviews" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("reviews")}>
        <MessageCircle className={`h-4 w-4 ${activeTab === "reviews" ? "text-bookverse-accent" : ""}`} />
        Reviews
        <div className={`${activeTab === "reviews" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger value="posts" className="relative px-2 py-3 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center gap-2" onClick={() => setActiveTab("posts")}>
        <FileText className={`h-4 w-4 ${activeTab === "posts" ? "text-bookverse-accent" : ""}`} />
        Posts
        <div className={`${activeTab === "posts" ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"} absolute bottom-0 left-0 right-0 transition-all duration-200`}></div>
      </TabsTrigger>
    </TabsList>;
};