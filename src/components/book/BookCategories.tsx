
import React from "react";
import { Badge } from "@/components/ui/badge";

interface BookCategoriesProps {
  categories?: string[];
}

export const BookCategories: React.FC<BookCategoriesProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {categories.slice(0, 2).map((category, index) => (
        <Badge key={`${category}-${index}`} variant="outline" className="text-xs">
          {category}
        </Badge>
      ))}
    </div>
  );
};
