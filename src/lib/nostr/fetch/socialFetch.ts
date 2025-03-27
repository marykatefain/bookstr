
// This file now re-exports the social functions from the social directory
// This maintains backward compatibility with existing imports
export {
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookActivity
} from './social';

// Re-export with a different name to avoid conflicts
export { fetchBookPosts as fetchBookPostsByISBN } from './social';
