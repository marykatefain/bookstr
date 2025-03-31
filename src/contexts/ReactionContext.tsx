import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn, reactToContent } from "@/lib/nostr";

// Define types for our reaction state and context
interface ReactionState {
  reactions: Record<string, { count: number; userReacted: boolean }>;
  pendingReactions: Set<string>;
}

type ReactionAction = 
  | { type: 'SET_REACTION'; contentId: string; count: number; userReacted: boolean }
  | { type: 'TOGGLE_REACTION_OPTIMISTIC'; contentId: string }
  | { type: 'SET_PENDING'; contentId: string; isPending: boolean }
  | { type: 'RESET_REACTIONS' };

interface ReactionContextType {
  getReactionState: (contentId: string) => { count: number; userReacted: boolean };
  isPending: (contentId: string) => boolean;
  toggleReaction: (contentId: string) => Promise<boolean>;
  updateReactionState: (contentId: string, count: number, userReacted: boolean) => void;
}

// Create the context with a default value
const ReactionContext = createContext<ReactionContextType | undefined>(undefined);

// Reducer function to handle state updates
function reactionReducer(state: ReactionState, action: ReactionAction): ReactionState {
  switch (action.type) {
    case 'SET_REACTION':
      return {
        ...state,
        reactions: {
          ...state.reactions,
          [action.contentId]: { count: action.count, userReacted: action.userReacted }
        }
      };
    case 'TOGGLE_REACTION_OPTIMISTIC': {
      const currentReaction = state.reactions[action.contentId] || { count: 0, userReacted: false };
      const newCount = currentReaction.userReacted 
        ? Math.max(0, currentReaction.count - 1) 
        : currentReaction.count + 1;
      
      return {
        ...state,
        reactions: {
          ...state.reactions,
          [action.contentId]: {
            count: newCount,
            userReacted: !currentReaction.userReacted
          }
        }
      };
    }
    case 'SET_PENDING': {
      const newPendingReactions = new Set(state.pendingReactions);
      if (action.isPending) {
        newPendingReactions.add(action.contentId);
      } else {
        newPendingReactions.delete(action.contentId);
      }
      
      return {
        ...state,
        pendingReactions: newPendingReactions
      };
    }
    case 'RESET_REACTIONS':
      return {
        reactions: {},
        pendingReactions: new Set<string>()
      };
    default:
      return state;
  }
}

// Provider component
export const ReactionProvider = React.memo(function ReactionProviderComponent({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reactionReducer, {
    reactions: {},
    pendingReactions: new Set<string>()
  });
  
  const { toast } = useToast();

  // Get reaction state for a given content ID
  const getReactionState = useCallback((contentId: string) => {
    return state.reactions[contentId] || { count: 0, userReacted: false };
  }, [state.reactions]);

  // Check if a reaction is pending for a given content ID
  const isPending = useCallback((contentId: string) => {
    return state.pendingReactions.has(contentId);
  }, [state.pendingReactions]);

  // Update reaction state for a given content ID
  const updateReactionState = useCallback((contentId: string, count: number, userReacted: boolean) => {
    dispatch({ type: 'SET_REACTION', contentId, count, userReacted });
  }, []);

  // Toggle reaction for a given content ID
  const toggleReaction = useCallback(async (contentId: string): Promise<boolean> => {
    console.log(`ReactionContext: toggleReaction called for ${contentId}`);
    
    if (!isLoggedIn()) {
      console.log("ReactionContext: User not logged in");
      toast({
        title: "Login required",
        description: "Please sign in to react to content",
        variant: "destructive"
      });
      return false;
    }

    // Prevent double reactions
    if (isPending(contentId)) {
      console.log(`ReactionContext: Reaction already pending for ${contentId}`);
      return false;
    }

    // Set pending state
    dispatch({ type: 'SET_PENDING', contentId, isPending: true });
    
    // Optimistically update UI
    dispatch({ type: 'TOGGLE_REACTION_OPTIMISTIC', contentId });

    try {
      console.log(`ReactionContext: Sending reaction to content ${contentId}`);
      const reactionId = await reactToContent(contentId);
      
      if (reactionId) {
        console.log(`ReactionContext: Reaction successful, ID: ${reactionId}`);
        
        // Notification is optional as the UI already updated optimistically
        // and multiple quick reactions shouldn't spam the user with toasts
        
        return true;
      } else {
        throw new Error("Failed to send reaction");
      }
    } catch (error) {
      console.error("ReactionContext: Error sending reaction:", error);
      
      // Revert the optimistic update
      dispatch({ type: 'TOGGLE_REACTION_OPTIMISTIC', contentId });
      
      toast({
        title: "Error",
        description: "Could not send reaction",
        variant: "destructive"
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_PENDING', contentId, isPending: false });
    }
  }, [toast, isPending]);

  const value = React.useMemo(() => ({
    getReactionState,
    isPending,
    toggleReaction,
    updateReactionState
  }), [getReactionState, isPending, toggleReaction, updateReactionState]);

  return (
    <ReactionContext.Provider value={value}>
      {children}
    </ReactionContext.Provider>
  );
});

// Define a constant export for the hook
export const useReactionContext = () => {
  const context = useContext(ReactionContext);
  if (context === undefined) {
    throw new Error('useReactionContext must be used within a ReactionProvider');
  }
  return context;
};

// Re-export for compatibility with existing imports
export { useReactionContext as default };