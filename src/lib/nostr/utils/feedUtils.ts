
import { SocialActivity } from "../types";
import { batchFetchReactions } from "../fetch/reactions";
import { batchFetchReplies } from "../fetch/replies";

/**
 * Helper function to batch fetch reactions and replies for activities
 */
export async function enrichActivitiesWithData(activities: SocialActivity[]): Promise<SocialActivity[]> {
  // Get all activity IDs first
  const activityIds = activities.map(activity => activity.id);
  
  // Batch fetch reactions and replies
  const [reactionsMap, repliesMap] = await Promise.all([
    batchFetchReactions(activityIds),
    batchFetchReplies(activityIds)
  ]);
  
  // Enrich activities with the fetched data
  return activities.map(activity => ({
    ...activity,
    reactions: reactionsMap[activity.id] || { count: 0, userReacted: false },
    replies: repliesMap[activity.id] || []
  }));
}

// Global refresh state tracker
let lastGlobalRefreshTime = 0;
export const GLOBAL_REFRESH_COOLDOWN = 20000; // 20 seconds between global refreshes

/**
 * Check if a global feed refresh is allowed based on cooldown
 */
export function canRefreshGlobalFeed(): boolean {
  const now = Date.now();
  return now - lastGlobalRefreshTime >= GLOBAL_REFRESH_COOLDOWN;
}

/**
 * Update the last global refresh timestamp
 */
export function updateGlobalRefreshTimestamp(): void {
  lastGlobalRefreshTime = Date.now();
}

/**
 * Get the remaining cooldown time in seconds
 */
export function getGlobalRefreshCooldownRemaining(): number {
  const now = Date.now();
  return Math.max(0, Math.round((GLOBAL_REFRESH_COOLDOWN - (now - lastGlobalRefreshTime)) / 1000));
}
