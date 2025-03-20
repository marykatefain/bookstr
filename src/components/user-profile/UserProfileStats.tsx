
import React from "react";

interface TabCountProps {
  label: string;
  count: number;
}

interface UserProfileStatsProps {
  totalBooks: number;
  readingCount: number;
  postsCount: number;
  reviewsCount: number;
}

const TabCount: React.FC<TabCountProps> = ({ label, count }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold">{count}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export const UserProfileStats: React.FC<UserProfileStatsProps> = ({
  totalBooks,
  readingCount,
  postsCount,
  reviewsCount
}) => {
  return (
    <div className="flex justify-center gap-8 mt-2">
      <TabCount label="Books" count={totalBooks} />
      <TabCount label="Reading" count={readingCount} />
      <TabCount label="Posts" count={postsCount} />
      <TabCount label="Reviews" count={reviewsCount} />
    </div>
  );
};
