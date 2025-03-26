
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
      // Find the activity to determine its kind
      const activity = localActivities.find(a => a.id === activityId);
      if (!activity) {
        console.error(`Activity with id ${activityId} not found`);
        return;
      }
      
      // Determine the appropriate event kind based on activity type
      let eventKind = 1; // Default to text note
      if (activity.type === 'review') {
        eventKind = 1984; // Review kind
      }
      
      // Call reactToContent with the appropriate kind
      await reactToContent(activityId, "+", eventKind);
      
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
