import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AltTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  altText: string;
  setAltText: (text: string) => void;
  onSubmit: () => void;
  mediaPreview: string | null;
}

export function AltTextModal({
  open,
  onOpenChange,
  altText,
  setAltText,
  onSubmit,
  mediaPreview
}: AltTextModalProps) {
  // Handles submission via both button click and enter key
  const handleSubmit = () => {
    if (altText.trim()) {
      onSubmit();
    } else {
      onOpenChange(false); // Just close if they don't want to add alt text
    }
  };

  // Skip alt text and close modal
  const handleSkip = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-bookverse-ink">Add Alt Text</DialogTitle>
          <DialogDescription className="pt-2">
            Please add a description of your image to make it accessible to all readers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-4 items-start">
            {mediaPreview && (
              <div className="w-28 h-28 flex-shrink-0">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
            
            <div className="flex-1">
              <Label 
                htmlFor="alt-text" 
                className="text-sm font-medium text-bookverse-ink mb-1 block"
              >
                Image Description
              </Label>
              <Textarea
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe what appears in your image so people with visual impairments can understand it."
                className="resize-y"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Good alt text is concise but descriptive. Focus on what's important in the image.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}