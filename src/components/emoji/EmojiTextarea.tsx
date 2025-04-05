import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { EmojiPicker } from '@/components/emoji/EmojiPicker';
import data from '@emoji-mart/data';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

interface EmojiTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement> | string) => void;
}

interface EmojiSuggestion {
  id: string;
  name: string;
  native: string;
}

export function EmojiTextarea({ value, onChange, ...props }: EmojiTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [emojiSearch, setEmojiSearch] = useState<string | null>(null);
  const [emojiSuggestions, setEmojiSuggestions] = useState<EmojiSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null);
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  // Update cursor position when textarea changes or gets focused
  useEffect(() => {
    if (textareaRef.current) {
      const element = textareaRef.current;
      setCursorPosition({
        start: element.selectionStart,
        end: element.selectionEnd
      });
    }
  }, [value]);

  // Handle changes in the textarea
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const currentCursorPos = e.target.selectionStart;

    onChange(e);

    // Check for emoji autocomplete trigger
    const text = newValue.substring(0, currentCursorPos);
    // Match :emoji_name pattern at the current cursor position
    const colonMatch = /:([\w+-]*)$/.exec(text);

    if (colonMatch) {
      const searchTerm = colonMatch[1].toLowerCase();
      setEmojiSearch(searchTerm);
      searchEmojis(searchTerm);
      setShowEmojiSuggestions(true);
      setSelectedSuggestionIndex(0);
    } else {
      setEmojiSearch(null);
      setShowEmojiSuggestions(false);
    }
  };

  // Handle key navigation in emoji suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showEmojiSuggestions) return;

    // Handle keyboard navigation for emoji suggestions
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < emojiSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && emojiSuggestions.length > 0) {
      e.preventDefault();
      const selectedEmoji = emojiSuggestions[selectedSuggestionIndex];
      if (selectedEmoji && selectedEmoji.native) {
        insertEmoji(selectedEmoji);
      }
    } else if (e.key === 'Escape') {
      setShowEmojiSuggestions(false);
    } else if (e.key === 'Tab' && emojiSuggestions.length > 0) {
      e.preventDefault();
      const selectedEmoji = emojiSuggestions[selectedSuggestionIndex];
      if (selectedEmoji && selectedEmoji.native) {
        insertEmoji(selectedEmoji);
      }
    }
  };

  // Search for emojis matching the search term
  const searchEmojis = (searchTerm: string) => {
    if (!searchTerm) {
      setEmojiSuggestions([]);
      return;
    }

    try {
      // Ensure we have proper emoji data
      if (!data || !data.emojis) {
        return;
      }

      // Filter emojis from emoji-mart data
      const filteredEmojis: EmojiSuggestion[] = [];
      
      // Search through each category's emojis
      Object.entries(data.emojis).forEach(([id, emoji]: [string, any]) => {
        // Check if we have all required properties
        if (!emoji.native) return;
        
        // Check if the emoji name, shortcodes, or keywords match the search term
        if (
          emoji.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (emoji.shortcodes && Array.isArray(emoji.shortcodes) && emoji.shortcodes.some((sc: string) => sc.toLowerCase().includes(searchTerm.toLowerCase()))) ||
          (emoji.keywords && Array.isArray(emoji.keywords) && emoji.keywords.some((kw: string) => kw.toLowerCase().includes(searchTerm.toLowerCase())))
        ) {
          filteredEmojis.push({
            id,
            name: emoji.name || id,
            native: emoji.native
          });
        }

        // Limit suggestions to keep it performant
        if (filteredEmojis.length >= 6) {
          return;
        }
      });

      setEmojiSuggestions(filteredEmojis);
    } catch (error) {
      setEmojiSuggestions([]);
    }
  };

  // Insert an emoji at the current cursor position
  const insertEmoji = (emoji: EmojiSuggestion | { native: string }) => {
    if (!textareaRef.current || !cursorPosition) return;
    if (!emoji || !emoji.native) return; // Ensure emoji has a native property

    const textarea = textareaRef.current;
    const text = value;
    let newText: string;

    if (emojiSearch !== null) {
      // Replace the emoji shortcode with the emoji
      const lastColonPos = text.substring(0, cursorPosition.start).lastIndexOf(':');
      
      newText = 
        text.substring(0, lastColonPos) + 
        emoji.native + 
        text.substring(cursorPosition.start);
      
      // Create a synthetic event-like object for the onChange handler
      const newEvent = {
        target: {
          value: newText
        }
      } as ChangeEvent<HTMLTextAreaElement>;
      
      onChange(newEvent);

      // Set cursor position after the inserted emoji
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastColonPos + emoji.native.length;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      // Insert emoji at cursor position when using the emoji picker
      newText = 
        text.substring(0, cursorPosition.start) + 
        emoji.native + 
        text.substring(cursorPosition.end);
      
      onChange(newText);

      // Set cursor position after the inserted emoji
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = cursorPosition.start + emoji.native.length;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    }

    // Close the suggestions
    setShowEmojiSuggestions(false);
    setEmojiSearch(null);
  };

  // Handle emoji selection from picker
  const handleEmojiSelect = (emoji: { native: string }) => {
    if (!emoji || !emoji.native) return;
    insertEmoji(emoji);
  };

  // Handle clicks on emoji suggestions
  const handleSuggestionClick = (emoji: EmojiSuggestion) => {
    if (!emoji || !emoji.native) return;
    insertEmoji(emoji);
  };

  // Track cursor position on selection changes
  const handleSelect = () => {
    if (textareaRef.current) {
      setCursorPosition({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end">
        <div className="flex-1 relative">
          <ShadcnTextarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            className="pr-10"
            {...props}
          />
          
          {/* Emoji Picker Button */}
          <div className="absolute bottom-2 right-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
          
          {/* Emoji Suggestions Dropdown */}
          {showEmojiSuggestions && emojiSuggestions.length > 0 && (
            <div className="absolute top-0 mt-[-200px] left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md w-64">
              <ScrollArea className="max-h-60">
                <div className="p-1">
                  {emojiSuggestions.map((emoji, index) => (
                    <button
                      key={emoji.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 rounded-sm ${
                        index === selectedSuggestionIndex 
                          ? 'bg-primary/10' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSuggestionClick(emoji)}
                    >
                      <span className="text-xl">{emoji.native}</span>
                      <span className="text-sm">{emoji.name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}