
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, FileText, MessageCircle, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileTabsProps {
  onTabChange: (value: string) => void;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({
  onTabChange,
}) => {
  const isMobile = useIsMobile();
  
  const tabs = [
    {
      value: "posts",
      label: "Posts",
      icon: FileText
    },
    {
      value: "reviews",
      label: "Reviews",
      icon: MessageCircle
    },
    {
      value: "library",
      label: "Library",
      icon: Book
    },
    {
      value: "about",
      label: "About",
      icon: User
    }
  ];

  return (
    <TabsList className={`mb-6 ${isMobile ? 'w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start hide-scrollbar' : 'grid grid-cols-4'}`}>
      {tabs.map(tab => (
        <TabsTrigger 
          key={tab.value} 
          value={tab.value} 
          onClick={() => onTabChange(tab.value)}
          className={isMobile ? 'flex-shrink-0' : ''}
        >
          <tab.icon className="mr-2 h-4 w-4" />
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
