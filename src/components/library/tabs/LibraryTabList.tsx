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
  return <TabsList className="w-full bg-transparent rounded-none justify-between md:justify-between flex-wrap px-[21px] py-[6px] border-b border-b-slate-200 dark:border-b-slate-700">
      {[{
      id: "books",
      label: "All Books",
      icon: Book
    }, {
      id: "reading",
      label: "Reading",
      icon: BookOpen
    }, {
      id: "tbr",
      label: "To Read",
      icon: BookMarked
    }, {
      id: "read",
      label: "Read",
      icon: BookCheck
    }, {
      id: "reviews",
      label: "Reviews",
      icon: MessageCircle
    }, {
      id: "posts",
      label: "Posts",
      icon: FileText
    }].map(tab => <TabsTrigger key={tab.id} value={tab.id} onClick={() => setActiveTab(tab.id)} className="relative h-auto flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center justify-center gap-2 mx-0 px-0 py-[8px]">
          <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-bookverse-accent" : ""}`} />
          {tab.label}
          <div className={`absolute bottom-0 left-0 right-0 transition-all duration-200 z-10 ${activeTab === tab.id ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"}`}></div>
        </TabsTrigger>)}
    </TabsList>;
};