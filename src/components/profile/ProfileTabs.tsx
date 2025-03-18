
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-8">
      <TabsTrigger 
        value="posts" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Posts
        <div className={`${activeTab === "posts" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="reviews" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Reviews
        <div className={`${activeTab === "reviews" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="want-to-read" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        To Be Read (TBR)
        <div className={`${activeTab === "want-to-read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="reading" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Currently Reading
        <div className={`${activeTab === "reading" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
      <TabsTrigger 
        value="read" 
        className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Read
        <div className={`${activeTab === "read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
      </TabsTrigger>
    </TabsList>
  );
};
