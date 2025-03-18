
import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyFeedStateProps {
  type: "followers" | "global";
  onFindFriends?: () => void;
}

export function EmptyFeedState({ type, onFindFriends }: EmptyFeedStateProps) {
  return (
    <Card className="text-center p-6">
      <p className="text-muted-foreground mb-4">
        {type === "followers" 
          ? "No activity yet from people you follow" 
          : "No global activity available at the moment"}
      </p>
      {type === "followers" && (
        <Link to="/social">
          <Button onClick={onFindFriends}>
            <UserPlus className="mr-2 h-4 w-4" />
            Find Friends
          </Button>
        </Link>
      )}
    </Card>
  );
}
