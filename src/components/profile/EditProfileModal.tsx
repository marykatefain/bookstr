
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

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, bio: string, nip05?: string) => Promise<boolean | void>;
  initialName?: string;
  initialBio?: string;
  initialNip05?: string;
}

interface FormValues {
  name: string;
  bio: string;
  nip05?: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialName = "",
  initialBio = "",
  initialNip05 = ""
}) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialName,
      bio: initialBio,
      nip05: initialNip05
    }
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Update form values when initial values change
    form.reset({
      name: initialName,
      bio: initialBio,
      nip05: initialNip05
    });
  }, [initialName, initialBio, initialNip05, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const success = await onSubmit(values.name, values.bio, values.nip05);
      
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
                    A verified identity like an email address (e.g., name@domain.com).
                    Shows a checkmark next to your name.
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
