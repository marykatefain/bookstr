
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, reactToContent } from "@/lib/nostr";

interface ReactionState {
  count: number;
  userReacted: boolean;
}

interface UseReactionOptions {
  /** Optional callback to run when reactions are updated successfully */
  onSuccess?: (state: ReactionState) => void;
  /** Optional callback to run when reactions fail to update */
  onError?: (error: unknown) => void;
}

/**
 * Custom hook for handling reactions to content across the application
 * @param initialState Initial reaction state (count and whether user has reacted)
 * @param options Additional options for customizing behavior
 */
export function useReaction(
  initialState: ReactionState = { count: 0, userReacted: false },
  options?: UseReactionOptions
) {
  const [state, setState] = useState<ReactionState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update the reaction state if props change
  const updateReactionState = (newState: ReactionState) => {
    if (
      newState.count !== state.count || 
      newState.userReacted !== state.userReacted
    ) {
      setState(newState);
    }
  };

  /**
   * Toggle a reaction on a piece of content
   * @param contentId The ID of the content to react to
   * @returns Promise that resolves when the reaction is complete
   */
  const toggleReaction = async (contentId: string): Promise<boolean> => {
    console.log(`useReaction: toggleReaction called for ${contentId}`);
    
    if (!isLoggedIn()) {
      console.log("useReaction: User not logged in");
      toast({
        title: "Login required",
        description: "Please sign in to react to content",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);

    try {
      console.log(`useReaction: Sending reaction to content ${contentId}`);
      const reactionId = await reactToContent(contentId);
      
      if (reactionId) {
        console.log(`useReaction: Reaction successful, ID: ${reactionId}`);
        
        // Update local state optimistically
        const newState = {
          count: state.userReacted ? state.count - 1 : state.count + 1,
          userReacted: !state.userReacted
        };
        
        setState(newState);
        
        // Notify of success
        toast({
          title: "Reaction sent",
          description: state.userReacted 
            ? "You've removed your reaction" 
            : "You've reacted to this content"
        });
        
        // Call success callback if provided
        if (options?.onSuccess) {
          options.onSuccess(newState);
        }
        
        return true;
      } else {
        throw new Error("Failed to send reaction");
      }
    } catch (error) {
      console.error("useReaction: Error sending reaction:", error);
      
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
      
      // Call error callback if provided
      if (options?.onError) {
        options.onError(error);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    /** Current reaction state */
    reactionState: state,
    /** Whether a reaction is currently in progress */
    isLoading,
    /** Function to toggle a reaction on a piece of content */
    toggleReaction,
    /** Function to update the reaction state (e.g., from props) */
    updateReactionState
  };
}
