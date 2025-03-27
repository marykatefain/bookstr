
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, reactToContent } from "@/lib/nostr";
import { SocialActivity } from "@/lib/nostr/types";

export function useFeedReactions(activities: SocialActivity[], onActivitiesChanged?: (activities: SocialActivity[]) => void) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>(activities);
  const { toast } = useToast();

  const handleReact = async (activityId: string) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to react to posts",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Calling reactToContent from hook with eventId: ${activityId}`);
      const reactionId = await reactToContent(activityId);
      console.log(`Reaction result: ${reactionId ? 'Success' : 'Failed'}`);
      
      if (reactionId) {
        toast({
          title: "Reaction sent",
          description: "You've reacted to this post"
        });
        
        const updatedActivities = localActivities.map(activity => {
          if (activity.id === activityId) {
            const currentUserReacted = activity.reactions?.userReacted || false;
            const currentCount = activity.reactions?.count || 0;
            
            return {
              ...activity,
              reactions: {
                count: currentUserReacted ? currentCount - 1 : currentCount + 1,
                userReacted: !currentUserReacted
              }
            };
          }
          return activity;
        });
        
        setLocalActivities(updatedActivities);
        
        if (onActivitiesChanged) {
          onActivitiesChanged(updatedActivities);
        }
      } else {
        // If we got null from reactToContent, something went wrong
        throw new Error("Failed to publish reaction");
      }
    } catch (error) {
      console.error("Error reacting to post:", error);
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
    }
  };

  return {
    activities: localActivities,
    handleReact
  };
}
