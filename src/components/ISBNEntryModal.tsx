
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Book } from '@/lib/nostr/types';

interface ISBNEntryModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: Book, isbn: string) => void;
}

export function ISBNEntryModal({ book, isOpen, onClose }: ISBNEntryModalProps) {
  // Create an Open Library URL from book data
  const getOpenLibraryUrl = () => {
    // If we have a book.id that starts with 'ol:' extract the ID
    if (book.id && book.id.startsWith('ol:')) {
      const olId = book.id.substring(3); // Remove the 'ol:' prefix
      return `https://openlibrary.org/works/${olId}`;
    }
    
    // Fallback to search by title and author
    const titleParam = encodeURIComponent(book.title);
    const authorParam = encodeURIComponent(book.author);
    return `https://openlibrary.org/search?q=${titleParam}+${authorParam}`;
  };

  const openLibraryUrl = getOpenLibraryUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ISBN Not Found</DialogTitle>
          <DialogDescription className="pt-2">
            We couldn't find the ISBN for "{book.title}" by {book.author} in the Open Library database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm">
            Bookstr pulls book data from Open Library, an open-source database. This book entry is missing
            an ISBN identifier, which is needed to add it to your lists.
          </p>
          
          <p className="text-sm">
            You can help improve the Open Library database by adding the ISBN to the book entry. 
            Click the button below to view and edit this book on Open Library.
          </p>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => window.open(openLibraryUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink size={16} />
            Open in Open Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
