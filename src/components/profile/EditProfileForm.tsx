import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileEvent } from "@/lib/nostr/user";
import { NOSTR_KINDS } from "@/lib/nostr/types/constants";
import { updateUserProfile, getCurrentUser } from "@/lib/nostr/user";
import { useToast } from "@/hooks/use-toast";
import { NostrProfile } from "@/lib/nostr/types";

// Define the form validation schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Display name is required").max(50, "Display name must be 50 characters or less"),
  about: z.string().max(300, "Bio must be 300 characters or less").optional(),
  picture: z.string().url("Must be a valid URL").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  user: NostrProfile | null;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function EditProfileForm({ user, onClose, onProfileUpdated }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form with default values from user
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      about: user?.about || "",
      picture: user?.picture || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsSubmitting(true);
      
      // Create profile content as JSON string
      const profileContent = JSON.stringify({
        name: data.name,
        about: data.about,
        picture: data.picture,
      });
      
      // Create a Kind 0 metadata event
      const eventData = {
        kind: NOSTR_KINDS.SET_METADATA,
        content: profileContent,
        tags: [],
      };

      console.log("Creating event data for profile update Kind:", eventData.kind)
      
      // Publish to Nostr
      const eventId = await updateUserProfileEvent(eventData);
      
      if (eventId) {
        // Update the local user profile data
        const currentUser = getCurrentUser();
        if (currentUser) {
          updateUserProfile({
            ...currentUser,
            name: data.name,
            about: data.about,
            picture: data.picture,
          });
        }
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
        
        // Notify the parent component that the profile was updated
        onProfileUpdated();
        
        // Close the dialog
        onClose();
      } else {
        throw new Error("Failed to publish profile update");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name*</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell the world about yourself" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-bookverse-accent hover:bg-bookverse-highlight"
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}