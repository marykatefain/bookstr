
import React from "react";
import { Button } from "@/components/ui/button";
import { Book, BookOpen, BookMarked } from "lucide-react";

interface EmptyStateProps {
  type: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
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

  const message = messages[type as keyof typeof messages];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <message.icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{message.title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {message.description}
      </p>
      <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
        <Book className="mr-2 h-4 w-4" />
        Discover Books
      </Button>
    </div>
  );
};
