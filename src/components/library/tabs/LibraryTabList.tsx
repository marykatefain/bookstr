
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookMarked, BookCheck, Book, MessageCircle, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LibraryTabListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LibraryTabList: React.FC<LibraryTabListProps> = ({
  activeTab,
  setActiveTab
}) => {
  const isMobile = useIsMobile();

  const tabs = [
    {
      id: "books",
      label: "All Books",
      mobileLabel: "All",
      icon: Book
    }, 
    {
      id: "reading",
      label: "Reading",
      mobileLabel: "Reading",
      icon: BookOpen
    }, 
    {
      id: "tbr",
      label: "To Read",
      mobileLabel: "To Read",
      icon: BookMarked
    }, 
    {
      id: "read",
      label: "Read",
      mobileLabel: "Read",
      icon: BookCheck
    }, 
    {
      id: "reviews",
      label: "Reviews",
      mobileLabel: "Reviews",
      icon: MessageCircle
    }
  ];

  return (
    <TabsList className={`
      w-full bg-transparent rounded-none border-b border-b-slate-200 dark:border-b-slate-700
      ${isMobile ? 'overflow-x-auto overflow-y-hidden flex-nowrap justify-start px-2 py-1 hide-scrollbar' : 'justify-between flex-wrap px-[21px] py-[6px]'}
    `}>
      {tabs.map(tab => (
        <TabsTrigger 
          key={tab.id} 
          value={tab.id} 
          onClick={() => setActiveTab(tab.id)} 
          className={`
            relative h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none 
            data-[state=active]:text-bookverse-accent data-[state=active]:font-medium flex items-center justify-center gap-2
            ${isMobile ? 'flex-shrink-0 px-3' : 'flex-1 mx-0 px-0'} py-[8px]
          `}
        >
          <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-bookverse-accent" : ""}`} />
          {isMobile ? tab.mobileLabel : tab.label}
          <div 
            className={`
              absolute bottom-0 left-0 right-0 transition-all duration-200 z-10
              ${activeTab === tab.id ? "bg-bookverse-accent h-1 rounded-t-sm" : "bg-transparent h-0.5"}
            `}
          ></div>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
