
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function ImageViewerModal({ 
  open, 
  onOpenChange, 
  images, 
  currentIndex, 
  onNavigate 
}: ImageViewerModalProps) {
  if (!images.length) return null;
  
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  };
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-lg w-full p-0 bg-transparent border-none">
        <div className="relative flex items-center justify-center w-full h-full bg-black/80 p-4 rounded-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 z-50 bg-black/40 text-white hover:bg-black/60"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {hasMultiple && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white hover:bg-black/60"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white hover:bg-black/60"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
          
          <div className="w-full max-h-[80vh] flex items-center justify-center">
            <img 
              src={currentImage} 
              alt="Full size image" 
              className="max-w-full max-h-[80vh] object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          {hasMultiple && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-gray-500'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(index);
                  }}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

