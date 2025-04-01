
import React from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, bio: string, website?: string, nip05?: string, pictureUrl?: string) => Promise<boolean | void>;
  initialName?: string;
  initialBio?: string;
  initialWebsite?: string;
  initialNip05?: string;
  initialPictureUrl?: string;
}

interface FormValues {
  name: string;
  bio: string;
  website?: string;
  nip05?: string;
  pictureUrl?: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialName = "",
  initialBio = "",
  initialWebsite = "",
  initialNip05 = "",
  initialPictureUrl = ""
}) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialName,
      bio: initialBio,
      website: initialWebsite,
      nip05: initialNip05,
      pictureUrl: initialPictureUrl
    }
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Update form values when initial values change
    form.reset({
      name: initialName,
      bio: initialBio,
      website: initialWebsite,
      nip05: initialNip05,
      pictureUrl: initialPictureUrl
    });
  }, [initialName, initialBio, initialWebsite, initialNip05, initialPictureUrl, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const success = await onSubmit(values.name, values.bio, values.website, values.nip05, values.pictureUrl);
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
        onOpenChange(false);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update your profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-bookverse-ink">Edit Your Profile</DialogTitle>
          <DialogDescription className="pt-2">
            Update your display name and bio information.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell others about yourself..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pictureUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Direct link to your profile picture image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourwebsite.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Your personal website or blog.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nip05"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP-05 Identifier</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="username@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    <div className="space-y-1">
                      <p>A verified identity like an email address (e.g., name@domain.com).
                      Shows a checkmark next to your name.</p>
                      <a 
                        href="https://nostr.how/en/guides/get-verified"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-bookverse-accent hover:text-bookverse-highlight mt-1"
                      >
                        Learn how to get one <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-bookverse-accent hover:bg-bookverse-highlight"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
