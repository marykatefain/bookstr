
import { useEffect } from "react";
import { useReactionContext } from "@/contexts/ReactionContext";
import { fetchReactions } from "@/lib/nostr";

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
 * This hook now uses the centralized ReactionContext
 * 
 * @param contentId ID of the content to handle reactions for
 * @param initialState Initial reaction state (count and whether user has reacted)
 * @param options Additional options for customizing behavior
 */
export function useReaction(
  contentId: string,
  initialState?: ReactionState,
  options?: UseReactionOptions
) {
  const { 
    getReactionState, 
    isPending, 
    toggleReaction, 
    updateReactionState 
  } = useReactionContext();

  // If initial state is provided, update the context
  useEffect(() => {
    if (initialState) {
      updateReactionState(contentId, initialState.count, initialState.userReacted);
    } else {
      // If no initial state, fetch the reactions
      fetchReactionData();
    }
  }, [contentId, initialState?.count, initialState?.userReacted]);

  // Function to fetch reaction data from the server
  const fetchReactionData = async () => {
    try {
      console.log(`useReaction: Fetching reactions for ${contentId}`);
      const result = await fetchReactions(contentId);
      console.log(`useReaction: Fetched reactions for ${contentId}:`, result);
      updateReactionState(contentId, result.count, result.userReacted);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      if (options?.onError) {
        options.onError(error);
      }
    }
  };

  /**
   * Toggle a reaction on a piece of content
   * @returns Promise that resolves when the reaction is complete
   */
  const handleToggleReaction = async (): Promise<boolean> => {
    const result = await toggleReaction(contentId);
    
    if (result && options?.onSuccess) {
      options.onSuccess(getReactionState(contentId));
    }
    
    return result;
  };

  return {
    /** Current reaction state */
    reactionState: getReactionState(contentId),
    /** Whether a reaction is currently in progress */
    isLoading: isPending(contentId),
    /** Function to toggle a reaction on a piece of content */
    toggleReaction: handleToggleReaction,
    /** Function to refresh reaction data from the server */
    refreshReactions: fetchReactionData
  };
}

/**
 * @deprecated Use the new useReaction hook with contentId parameter instead
 */
export function useReactionLegacy(
  initialState: ReactionState = { count: 0, userReacted: false },
  options?: UseReactionOptions
) {
  console.warn("useReactionLegacy is deprecated. Please migrate to the new useReaction hook with contentId parameter.");
  
  return {
    reactionState: initialState,
    isLoading: false,
    toggleReaction: async (contentId: string) => {
      const { toggleReaction } = useReactionContext();
      return toggleReaction(contentId);
    },
    updateReactionState: () => {
      console.warn("updateReactionState in legacy hook is a no-op. Please migrate to the new useReaction hook.");
    }
  };
}
