
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PostMediaPreviewProps {
  mediaPreview: string | null;
  mediaType: "image" | "video" | null;
  clearMedia: () => void;
}

export function PostMediaPreview({ mediaPreview, mediaType, clearMedia }: PostMediaPreviewProps) {
  if (!mediaPreview) return null;
  
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white z-10"
        onClick={clearMedia}
      >
        <X className="h-4 w-4" />
      </Button>
      {mediaType === 'image' ? (
        <img 
          src={mediaPreview} 
          alt="Preview" 
          className="max-h-60 rounded-md object-contain mx-auto" 
        />
      ) : (
        <video 
          src={mediaPreview} 
          controls 
          className="max-h-60 rounded-md w-full" 
        />
      )}
    </div>
  );
}
