
import React from "react";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Trash2, Server } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PostMediaPreviewProps {
  mediaPreview: string | null;
  mediaType: "image" | "video" | null;
  mediaAltText?: string;
  mediaUrl?: string;
  mediaService?: string;
  uploadProgress?: number;
  clearMedia: () => void;
}

export function PostMediaPreview({ 
  mediaPreview, 
  mediaType, 
  mediaAltText,
  mediaUrl,
  mediaService,
  uploadProgress = 0,
  clearMedia 
}: PostMediaPreviewProps) {
  if (!mediaPreview) return null;
  
  // Display uploading state if there's upload progress
  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white z-10"
        onClick={clearMedia}
        disabled={isUploading}
      >
        <X className="h-4 w-4" />
      </Button>
      
      {mediaType === 'image' ? (
        <div className="relative">
          <img 
            src={mediaPreview} 
            alt={mediaAltText || "Preview"} 
            className="max-h-60 rounded-md object-contain mx-auto" 
          />
          {mediaAltText && (
            <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
              Alt text added
            </div>
          )}
        </div>
      ) : (
        <video 
          src={mediaPreview} 
          controls 
          className="max-h-60 rounded-md w-full" 
        />
      )}
      
      {/* Show the media URL and service if available */}
      {mediaUrl && !isUploading && (
        <div className="mt-2 flex flex-col gap-1">
          <div className="text-xs text-muted-foreground flex items-center">
            <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {mediaUrl}
            </a>
          </div>
          
          {/* Add service information if available */}
          {mediaService && (
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <Server className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Uploaded via {mediaService}</span>
            </div>
          )}
          
          {/* Add a clear button to start a new post after successful upload */}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 text-xs"
            onClick={clearMedia}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear & Start New Post
          </Button>
        </div>
      )}
      
      {isUploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-md">
          <div className="text-white font-medium">Uploading: {uploadProgress}%</div>
          <div className="w-3/4 mt-2">
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
}
