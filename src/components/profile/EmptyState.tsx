
import React from "react";
import { Button } from "@/components/ui/button";
import { Book, BookOpen, BookMarked } from "lucide-react";
import { Link } from "react-router-dom";

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
      description: "Start reading a book by searching for one to add to your library",
      icon: BookOpen
    },
    read: {
      title: "No books read yet",
      description: "Mark books as read after you finish them",
      icon: Book
    },
    "want-to-read": {
      title: "No books in your want to read list",
      description: "Add books to your reading list by searching for them",
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
      <Link to="/books">
        <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
          <Book className="mr-2 h-4 w-4" />
          {actionText || "Find Books to Add"}
        </Button>
      </Link>
    </div>
  );
};
