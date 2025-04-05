
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Book, BookOpen, BookMarked, FileText } from "lucide-react";
import { Book as BookType } from "@/lib/nostr/types";

interface StatsCardsProps {
  books: {
    tbr: BookType[];
    reading: BookType[];
    read: BookType[];
  };
  postsCount: number;
  reviewsCount?: number;
  onTabChange: (tab: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ books, postsCount, reviewsCount = 0, onTabChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card 
        className="cursor-pointer hover:border-bookverse-accent transition-colors"
        onClick={() => onTabChange("tbr")}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <BookMarked className="h-8 w-8 text-bookverse-accent mb-2" />
            <div className="text-2xl font-bold">{books.tbr.length}</div>
            <p className="text-muted-foreground">To Be Read</p>
          </div>
        </CardContent>
      </Card>
      <Card 
        className="cursor-pointer hover:border-bookverse-accent transition-colors"
        onClick={() => onTabChange("reading")}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <BookOpen className="h-8 w-8 text-bookverse-accent mb-2" />
            <div className="text-2xl font-bold">{books.reading.length}</div>
            <p className="text-muted-foreground">Currently Reading</p>
          </div>
        </CardContent>
      </Card>
      <Card 
        className="cursor-pointer hover:border-bookverse-accent transition-colors"
        onClick={() => onTabChange("read")}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Book className="h-8 w-8 text-bookverse-accent mb-2" />
            <div className="text-2xl font-bold">{books.read.length}</div>
            <p className="text-muted-foreground">Books Read</p>
          </div>
        </CardContent>
      </Card>
      <Card 
        className="cursor-pointer hover:border-bookverse-accent transition-colors"
        onClick={() => onTabChange("reviews")}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <FileText className="h-8 w-8 text-bookverse-accent mb-2" />
            <div className="text-2xl font-bold">{reviewsCount}</div>
            <p className="text-muted-foreground">Reviews</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
