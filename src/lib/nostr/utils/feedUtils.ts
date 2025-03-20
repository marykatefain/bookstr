
import { SocialActivity } from "../types";
import { fetchReplies, fetchReactions } from "../";

/**
 * Helper function to batch fetch reactions and replies for activities
 */
export async function enrichActivitiesWithData(activities: SocialActivity[]): Promise<SocialActivity[]> {
  // Get all activity IDs first
  const activityIds = activities.map(activity => activity.id);
  
  // Batch fetching in groups of 5 to avoid too many parallel requests
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < activityIds.length; i += batchSize) {
    batches.push(activityIds.slice(i, i + batchSize));
  }
  
  // Process each batch sequentially
  const enrichedActivities = [...activities];
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (activityId) => {
        try {
          const [replies, reactions] = await Promise.all([
            fetchReplies(activityId),
            fetchReactions(activityId)
          ]);
          
          // Find the activity in our array and enrich it
          const activityIndex = enrichedActivities.findIndex(a => a.id === activityId);
          if (activityIndex !== -1) {
            enrichedActivities[activityIndex] = {
              ...enrichedActivities[activityIndex],
              replies,
              reactions
            };
          }
        } catch (error) {
          console.error(`Error fetching data for activity ${activityId}:`, error);
          // Continue with other activities
        }
      })
    );
  }
  
  return enrichedActivities;
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

