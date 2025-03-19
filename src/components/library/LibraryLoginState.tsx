
import React from "react";
import { EmptyState } from "@/components/profile/EmptyState";

export const LibraryLoginState: React.FC = () => {
  return (
    <div className="container py-8">
      <EmptyState
        title="Sign in to view your library"
        description="Your reading list, current books, and reading history will appear here"
        actionText="Sign in with Nostr"
        actionType="login"
      />
    </div>
  );
};
