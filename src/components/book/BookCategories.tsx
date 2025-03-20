
import React from "react";
import { Badge } from "@/components/ui/badge";

interface BookCategoriesProps {
  categories?: string[];
}

export const BookCategories: React.FC<BookCategoriesProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  // Only display the first category
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <Badge key={`${categories[0]}-0`} variant="outline" className="text-xs">
        {categories[0]}
      </Badge>
    </div>
  );
};
