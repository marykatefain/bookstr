
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Link, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface ProfileHeaderProps {
  user: {
    picture?: string;
    name?: string;
    display_name?: string;
    npub?: string;
    pubkey?: string;
    about?: string;
  } | null;
  toggleRelaySettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, toggleRelaySettings }) => {
  const { toast } = useToast();
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

  const copyProfileLink = () => {
    // Use the pubkey instead of npub for the URL, and change the domain to bookstr.xyz
    // Also change /profile to /user in the path
    const pubkey = user?.pubkey || "";
    navigator.clipboard.writeText(`https://bookstr.xyz/user/${pubkey}`);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard"
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
        <img
          src={user?.picture || "https://i.pravatar.cc/300"}
          alt={user?.name || "User"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-bookverse-ink">
            {user?.name || user?.display_name || "Nostr User"}
          </h1>
          <p className="text-muted-foreground">{user?.npub}</p>
          <p className="mt-2">{user?.about || "No bio yet"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={copyProfileLink}>
            <Link className="h-4 w-4 mr-2" />
            Copy Profile Link
          </Button>
          <Button 
            size="sm" 
            className="bg-bookverse-accent hover:bg-bookverse-highlight"
            onClick={() => setShowEditProfileDialog(true)}
          >
            <Book className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={toggleRelaySettings}>
            <Settings className="h-4 w-4 mr-2" />
            Relays
          </Button>
        </div>
      </div>
      
      {/* Edit Profile Feature Not Available Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bookverse-ink">Profile Editing Coming Soon</DialogTitle>
            <DialogDescription className="pt-2">
              The ability to edit your profile is not yet supported in this prototype version of Bookstr.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              We're working on implementing profile customization in a future update. Stay tuned for this exciting feature!
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditProfileDialog(false)} className="w-full sm:w-auto">
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
