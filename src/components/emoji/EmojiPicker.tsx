import React, { useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { useTheme } from 'next-themes';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: { native: string }) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [open, setOpen] = React.useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          type="button"
        >
          <Smile className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Insert emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        sideOffset={5}
        align="start"
      >
        <Picker
          data={data}
          onEmojiSelect={onEmojiSelect}
          theme={isDarkTheme ? 'dark' : 'light'}
          navPosition="none"
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}