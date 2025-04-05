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

export function FeedTypeSelector({ activePath, paths }: FeedTypeSelectorProps) {
  // Return null if paths is undefined or empty
  if (!paths || paths.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      {paths.map((option) => (
        <Link
          key={option.path}
          to={option.path}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activePath === option.path 
              ? "bg-background text-foreground shadow-sm" 
              : ""
          }`}
        >
          {option.label === "Following" ? (
            <Users className="h-4 w-4 mr-2" />
          ) : (
            <Globe className="h-4 w-4 mr-2" />
          )}
          <span>{option.label}</span>
        </Link>
      ))}
    </div>
  );
}