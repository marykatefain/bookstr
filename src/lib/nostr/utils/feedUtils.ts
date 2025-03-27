
import { SocialActivity } from "../types";
import { fetchReplies, fetchReactions } from "../";
import { batchFetchReplies, batchFetchReactions } from "../fetch/social/interactions";

/**
 * Helper function to batch fetch reactions and replies for activities
 */
export async function enrichActivitiesWithData(activities: SocialActivity[]): Promise<SocialActivity[]> {
  if (!activities || activities.length === 0) {
    return [];
  }
  
  // Get all activity IDs first
  const activityIds = activities.map(activity => activity.id);
  
  try {
    // Use batch fetching APIs for better performance
    const [reactionsMap, repliesMap] = await Promise.all([
      batchFetchReactions(activityIds),
      batchFetchReplies(activityIds)
    ]);
    
    // Apply the fetched data to the activities
    return activities.map(activity => ({
      ...activity,
      reactions: reactionsMap[activity.id] || { count: 0, userReacted: false },
      replies: repliesMap[activity.id] || []
    }));
  } catch (error) {
    console.error("Error batch fetching interaction data:", error);
    
    // Fall back to sequential fetching if batch fetching fails
    return sequentialEnrichActivities(activities);
  }
}

/**
 * Fallback method to sequentially fetch activity data if batch fetch fails
 */
async function sequentialEnrichActivities(activities: SocialActivity[]): Promise<SocialActivity[]> {
  // Process each batch sequentially
  const enrichedActivities = [...activities];
  
  // Batch size for processing
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < activities.length; i += batchSize) {
    batches.push(activities.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (activity) => {
        try {
          const [replies, reactions] = await Promise.all([
            fetchReplies(activity.id),
            fetchReactions(activity.id)
          ]);
          
          // Find the activity in our array and enrich it
          const activityIndex = enrichedActivities.findIndex(a => a.id === activity.id);
          if (activityIndex !== -1) {
            enrichedActivities[activityIndex] = {
              ...enrichedActivities[activityIndex],
              replies,
              reactions
            };
          }
        } catch (error) {
          console.error(`Error fetching data for activity ${activity.id}:`, error);
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

/**
 * Lazily fetch and populate author details for activities
 */
export async function lazyLoadActivityAuthors(activities: SocialActivity[]): Promise<void> {
  // Implementation would go here, but requires changes to multiple components
  // This would be a separate optimization to implement
}
