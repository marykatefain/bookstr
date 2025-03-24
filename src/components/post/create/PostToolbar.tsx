
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ImageIcon, VideoIcon } from "lucide-react";
import { Book } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";

interface PostToolbarProps {
  mediaType: "image" | "video" | null;
  fileInputRef: RefObject<HTMLInputElement>;
  isSpoiler: boolean;
  setIsSpoiler: (value: boolean) => void;
  posting: boolean;
  content: string;
  selectedBook: Book | null;
  handleSubmit: () => void;
}

export function PostToolbar({
  mediaType,
  fileInputRef,
  isSpoiler,
  setIsSpoiler,
  posting,
  content,
  selectedBook,
  handleSubmit
}: PostToolbarProps) {
  const { toast } = useToast();
  
  const handleMediaButtonClick = () => {
    // Show toast notification instead of opening file input
    toast({
      title: "Feature not available",
      description: "Media uploads are not yet supported on Bookstr",
      variant: "warning"
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          ref={fileInputRef}
        />
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={handleMediaButtonClick}
        >
          {mediaType === 'video' ? (
            <VideoIcon className="mr-2 h-4 w-4" />
          ) : (
            <ImageIcon className="mr-2 h-4 w-4" />
          )}
          <span>Add Media</span>
        </Button>
        
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center space-x-2">
            <Switch
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={setIsSpoiler}
            />
            <Label htmlFor="spoiler" className="flex items-center cursor-pointer">
              <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500" />
              <span className="text-sm">Spoiler</span>
            </Label>
          </div>
        </div>
      </div>
      
      <Button 
        className="ml-auto mt-2 sm:mt-0" 
        disabled={posting || (!content.trim() && !selectedBook)}
        onClick={handleSubmit}
      >
        {posting ? "Posting..." : "Post"}
      </Button>
    </>
  );
}
