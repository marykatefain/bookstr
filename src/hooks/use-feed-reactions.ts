
import { useState, useEffect } from "react";
import { SocialActivity } from "@/lib/nostr/types";
import { useReaction } from "@/hooks/use-reaction";

export function useFeedReactions(
  activities: SocialActivity[], 
  onActivitiesChanged?: (activities: SocialActivity[]) => void
) {
  const [localActivities, setLocalActivities] = useState<SocialActivity[]>(activities);
  
  // When the input activities array changes, update the local state
  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  // We don't need the reaction state from useReaction
  // since we manage the state per activity
  const { toggleReaction } = useReaction();

  const handleReact = async (activityId: string) => {
    console.log(`useFeedReactions: handleReact called with activityId: ${activityId}`);
    
    const activity = localActivities.find(a => a.id === activityId);
    if (!activity) {
      console.error(`Activity with ID ${activityId} not found`);
      return;
    }
    
    const currentUserReacted = activity.reactions?.userReacted || false;
    const currentCount = activity.reactions?.count || 0;
    
    // Call our centralized reaction hook
    const success = await toggleReaction(activityId);
    
    if (success) {
      const updatedActivities = localActivities.map(activity => {
        if (activity.id === activityId) {
          console.log(`Updating activity ${activityId}: currentUserReacted: ${currentUserReacted}, currentCount: ${currentCount}`);
          
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
      
      console.log("Updated activities after reaction");
      setLocalActivities(updatedActivities);
      
      if (onActivitiesChanged) {
        console.log("Calling onActivitiesChanged callback");
        onActivitiesChanged(updatedActivities);
      }
    }
  };

  return {
    activities: localActivities,
    handleReact
  };
}
