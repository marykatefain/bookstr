
import React from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Book } from "@/lib/nostr/types";

interface OpenLibraryContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
  missingFields: string[];
}

export const OpenLibraryContributionDialog: React.FC<OpenLibraryContributionDialogProps> = ({
  open,
  onOpenChange,
  book,
  missingFields
}) => {
  const handleContribute = () => {
    // Just point to the OpenLibrary homepage
    const openLibraryUrl = "https://openlibrary.org";
    
    // Open the URL in a new tab
    window.open(openLibraryUrl, "_blank", "noopener,noreferrer");
    
    // Close the dialog
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Incomplete Book Information</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-4">
              This book is missing some important information:
            </p>
            <ul className="list-disc pl-6 mb-4">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
            <p>
              Would you like to contribute this data to OpenLibrary? Your contribution helps build a better catalog for everyone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={handleContribute}>
            Contribute to OpenLibrary
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
