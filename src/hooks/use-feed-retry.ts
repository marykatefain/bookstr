
import { useRef, useCallback } from "react";
import { useToast } from "./use-toast";

interface UseFeedRetryOptions {
  maxRetries?: number;
  isBackgroundRefresh?: boolean;
  onRetryComplete?: () => void;
}

interface UseFeedRetryResult {
  retryCount: number;
  scheduleRetry: (retryFn: () => Promise<void>) => void;
  resetRetryCount: () => void;
}

export function useFeedRetry({
  maxRetries = 3,
  isBackgroundRefresh = false,
  onRetryComplete
}: UseFeedRetryOptions = {}): UseFeedRetryResult {
  const { toast } = useToast();
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any retry timeout on unmount
  const cleanupTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const resetRetryCount = useCallback(() => {
    retryCountRef.current = 0;
    cleanupTimeout();
  }, [cleanupTimeout]);

  const scheduleRetry = useCallback(async (retryFn: () => Promise<void>) => {
    // Only show toast and retry if this isn't already a retry and it's not a background refresh
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      console.log(`Retrying feed load attempt ${retryCountRef.current}/${maxRetries}...`);
      
      // Retry with exponential backoff
      cleanupTimeout();
      
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          await retryFn();
        } catch (error) {
          if (retryCountRef.current < maxRetries) {
            scheduleRetry(retryFn);
          } else if (!isBackgroundRefresh) {
            // Only show error toast after all retries failed and not in background mode
            toast({
              title: "Feed loading issue",
              description: "We're having trouble loading the latest posts. Please try again later.",
              variant: "destructive"
            });
            
            if (onRetryComplete) {
              onRetryComplete();
            }
          }
        }
      }, 2000 * Math.pow(2, retryCountRef.current - 1)); // 2s, 4s, 8s
    } else if (!isBackgroundRefresh) {
      // Only show error toast after all retries failed and not in background mode
      toast({
        title: "Feed loading issue",
        description: "We're having trouble loading the latest posts. Please try again later.",
        variant: "destructive"
      });
      
      if (onRetryComplete) {
        onRetryComplete();
      }
    }
  }, [maxRetries, isBackgroundRefresh, cleanupTimeout, toast, onRetryComplete]);

  return {
    retryCount: retryCountRef.current,
    scheduleRetry,
    resetRetryCount
  };
}
