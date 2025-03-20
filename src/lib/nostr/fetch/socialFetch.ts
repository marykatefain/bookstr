
// This file now re-exports the social functions from the social directory
// This maintains backward compatibility with existing imports
export {
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPosts,
  fetchBookActivity
} from './social';
