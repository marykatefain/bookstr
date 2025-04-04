
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ImageIcon, VideoIcon, Upload, Send, Loader2 } from "lucide-react";
import { Book } from "@/lib/nostr/types";

interface PostToolbarProps {
  mediaType: "image" | "video" | null;
  fileInputRef: RefObject<HTMLInputElement>;
  isSpoiler: boolean;
  setIsSpoiler: (value: boolean) => void;
  posting: boolean;
  uploading?: boolean;
  content: string;
  selectedBook: Book | null;
  hasMedia?: boolean;
  handleSubmit: () => void;
}

export function PostToolbar({
  mediaType,
  fileInputRef,
  isSpoiler,
  setIsSpoiler,
  posting,
  uploading = false,
  content,
  selectedBook,
  hasMedia = false,
  handleSubmit
}: PostToolbarProps) {

  const handleMediaButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  // Determine button state and text
  const isDisabled = posting || uploading || (!content.trim() && !selectedBook);
  let buttonIcon = <Send className="mr-2 h-4 w-4" />;
  let buttonText = "Post";
  
  if (uploading) {
    buttonIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    buttonText = "Uploading Media...";
  } else if (posting) {
    buttonIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    buttonText = "Publishing...";
  } else if (hasMedia) {
    buttonIcon = <Send className="mr-2 h-4 w-4" />;
    buttonText = "Post with Media";
  }
  
  return (
    <>
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={handleMediaButtonClick}
          disabled={posting || uploading}
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
        disabled={isDisabled}
        onClick={handleSubmit}
      >
        {buttonIcon}
        {buttonText}
      </Button>
    </>
  );
}
