import React, { useState, useCallback } from "react";
import { BookGrid } from "@/components/library/BookGrid";
import { BookList } from "@/components/library/BookList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { fetchUserBooks } from "@/lib/nostr";
import { Book } from "@/lib/nostr/types";
import { useUserLibrary } from "@/hooks/use-library-data";

interface UserLibraryTabProps {
  pubkey: string;
  mode?: "grid" | "list";
}

const initialLibrary = {
  tbr: [],
  reading: [],
  read: []
};

async function fetchLibraryFromPubkey(pubkey: string) {
  try {
    return await fetchUserBooks(pubkey);
  } catch (error) {
    console.error("Error fetching user library:", error);
    return initialLibrary;
  }
}

export const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ pubkey, mode = "grid" }) => {
  const [viewMode, setViewMode] = useState(mode);

  const {
    library,
    libraryLoading,
    libraryError,
    refetchLibrary,
  } = useUserLibrary(pubkey);

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // Fetch user library
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userLibrary', pubkey],
    queryFn: fetchLibraryFromPubkey,
    initialData: initialLibrary,
    placeholderData: (previousData) => previousData, // Replace keepPreviousData with placeholderData
    enabled: !!pubkey
  });
  
  if (libraryLoading || isLoading) {
    return <p>Loading library...</p>;
  }

  if (libraryError || error) {
    return <p>Error loading library.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Library</h2>

      <Tabs defaultValue="tbr" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="tbr">TBR ({data?.tbr?.length || 0})</TabsTrigger>
          <TabsTrigger value="reading">Reading ({data?.reading?.length || 0})</TabsTrigger>
          <TabsTrigger value="read">Read ({data?.read?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="tbr">
          {viewMode === "grid" ? (
            <BookGrid books={data?.tbr || []} onUpdate={refetch} />
          ) : (
            <BookList books={data?.tbr || []} onUpdate={refetch} />
          )}
        </TabsContent>
        <TabsContent value="reading">
          {viewMode === "grid" ? (
            <BookGrid books={data?.reading || []} onUpdate={refetch} />
          ) : (
            <BookList books={data?.reading || []} onUpdate={refetch} />
          )}
        </TabsContent>
        <TabsContent value="read">
          {viewMode === "grid" ? (
            <BookGrid books={data?.read || []} onUpdate={refetch} />
          ) : (
            <BookList books={data?.read || []} onUpdate={refetch} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
