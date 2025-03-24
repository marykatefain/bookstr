
import React, { RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ImageIcon, VideoIcon } from "lucide-react";
import { Book } from "@/lib/nostr/types";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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
  const [showMediaDialog, setShowMediaDialog] = useState(false);

  const handleMediaButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMediaDialog(true);
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

      {/* Media Feature Not Available Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bookverse-ink">Media Upload Coming Soon</DialogTitle>
            <DialogDescription className="pt-2">
              The ability to add images and videos to your posts is not yet supported in this prototype version of Bookstr.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              We're working on implementing media uploads in a future update. Stay tuned for this exciting feature!
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMediaDialog(false)} className="w-full sm:w-auto">
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
