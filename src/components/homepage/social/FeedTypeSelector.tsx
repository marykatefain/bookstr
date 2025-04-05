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
  return;
}