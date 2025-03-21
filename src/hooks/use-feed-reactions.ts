
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, reactToContent } from "@/lib/nostr";
import { SocialActivity } from "@/lib/nostr/types";

export function useFeedReactions(activities: SocialActivity[], onActivitiesChanged?: (activities: SocialActivity[]) => void) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>(activities);
  const [pendingReactions, setPendingReactions] = useState<Record<string, boolean>>({});
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

    // Set this activity as having a pending reaction
    setPendingReactions(prev => ({ ...prev, [activityId]: true }));

    try {
      console.log("Sending reaction to activity:", activityId);
      const result = await reactToContent(activityId);
      console.log("Reaction result:", result);
      
      if (result) {
        toast({
          title: "Reaction sent",
          description: "You've reacted to this post"
        });
      }
      
      // Update local state optimistically
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
    } finally {
      // Clear pending state
      setPendingReactions(prev => {
        const updated = { ...prev };
        delete updated[activityId];
        return updated;
      });
    }
  };

  return {
    activities: localActivities,
    pendingReactions,
    handleReact
  };
}
