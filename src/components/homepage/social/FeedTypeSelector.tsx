
import React from "react";
import { Link } from "react-router-dom";
import { Users, Globe } from "lucide-react";

interface PathOption {
  label: string;
  path: string;
}

interface FeedTypeSelectorProps {
  activePath: string;
  paths: PathOption[];
}

export function FeedTypeSelector({
  activePath,
  paths
}: FeedTypeSelectorProps) {
  // Return null if paths is undefined or empty
  if (!paths || paths.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center bg-muted/40 rounded-lg p-1">
      {paths.map((option) => {
        const isActive = activePath === option.path;
        return (
          <Link
            key={option.path}
            to={option.path}
            className={`${
              isActive 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            } px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center`}
          >
            {option.label === "Global" ? (
              <Globe className="w-4 h-4 mr-1.5" />
            ) : option.label === "Following" ? (
              <Users className="w-4 h-4 mr-1.5" />
            ) : null}
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
