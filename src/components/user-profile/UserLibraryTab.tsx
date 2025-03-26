
import React, { useState, useCallback } from "react";
import { BookGrid } from "@/components/library/BookGrid";
import { BookList } from "@/components/library/BookList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book } from "@/lib/nostr/types";

interface UserLibraryTabProps {
  pubkey?: string;
  mode?: "grid" | "list";
  tbr?: Book[];
  reading?: Book[];
  read?: Book[];
}

export const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ 
  pubkey, 
  mode = "grid", 
  tbr = [], 
  reading = [], 
  read = [] 
}) => {
  const [viewMode, setViewMode] = useState(mode);

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Library</h2>

      <Tabs defaultValue="tbr" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="tbr">TBR ({tbr.length || 0})</TabsTrigger>
          <TabsTrigger value="reading">Reading ({reading.length || 0})</TabsTrigger>
          <TabsTrigger value="read">Read ({read.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="tbr">
          {viewMode === "grid" ? (
            <BookGrid books={tbr || []} />
          ) : (
            <BookList books={tbr || []} />
          )}
        </TabsContent>
        <TabsContent value="reading">
          {viewMode === "grid" ? (
            <BookGrid books={reading || []} />
          ) : (
            <BookList books={reading || []} />
          )}
        </TabsContent>
        <TabsContent value="read">
          {viewMode === "grid" ? (
            <BookGrid books={read || []} />
          ) : (
            <BookList books={read || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
