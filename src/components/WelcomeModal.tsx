
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const WelcomeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the welcome message
    const hasSeenWelcome = localStorage.getItem("bookstr-welcome-seen");
    
    if (!hasSeenWelcome) {
      // If not, show the welcome modal
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Save to localStorage so we don't show this again
    localStorage.setItem("bookstr-welcome-seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-bookverse-ink">Welcome to Bookstr Prototype</DialogTitle>
          <DialogDescription className="pt-2">
            This is an early prototype built with AI. Some features may be limited or under development.
            We're continuously working to improve the experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Bookstr is a decentralized reading platform on the Nostr network. 
            As we're in prototype stage, you might encounter some limitations 
            while we work on enhancing the platform.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
