
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book } from '@/lib/nostr/types';

interface ISBNEntryModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: Book, isbn: string) => void;
}

export function ISBNEntryModal({ book, isOpen, onClose, onSubmit }: ISBNEntryModalProps) {
  const [isbn, setIsbn] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Basic ISBN validation (ISBN-10 or ISBN-13)
    const isbnRegex = /^(?:\d{10}|\d{13})$/;
    
    if (!isbn) {
      setError('Please enter an ISBN');
      return;
    }
    
    if (!isbnRegex.test(isbn.replace(/-/g, ''))) {
      setError('Please enter a valid 10 or 13 digit ISBN');
      return;
    }
    
    setError('');
    onSubmit(book, isbn.replace(/-/g, ''));
    setIsbn('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter ISBN Manually</DialogTitle>
          <DialogDescription>
            We couldn't find the ISBN for "{book.title}" by {book.author}. Please enter it manually to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isbn" className="text-right">
              ISBN
            </Label>
            <Input
              id="isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Enter 10 or 13 digit ISBN"
              className="col-span-3"
            />
            {error && <p className="text-destructive text-sm col-span-4 text-center">{error}</p>}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Save ISBN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
