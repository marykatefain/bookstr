
import React from "react";
import { Button } from "@/components/ui/button";
import { Book, BookOpen, BookMarked } from "lucide-react";

export interface EmptyStateProps {
  type?: string;
  title?: string;
  description?: string;
  actionText?: string;
  actionType?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  title, 
  description, 
  actionText, 
  actionType 
}) => {
  const messages = {
    reading: {
      title: "No books currently reading",
      description: "Books you start reading will appear here",
      icon: BookOpen
    },
    read: {
      title: "No books read yet",
      description: "Books you've finished will appear here",
      icon: Book
    },
    "want-to-read": {
      title: "No books in your want to read list",
      description: "Books you want to read in the future will appear here",
      icon: BookMarked
    }
  };

  // Use provided props or fallback to predefined messages based on type
  const message = type ? messages[type as keyof typeof messages] : null;
  const Icon = message?.icon || Book;
  const titleText = title || message?.title || "No items found";
  const descriptionText = description || message?.description || "Items will appear here";

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{titleText}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {descriptionText}
      </p>
      {actionText && (
        <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
          <Book className="mr-2 h-4 w-4" />
          {actionText}
        </Button>
      )}
    </div>
  );
};
