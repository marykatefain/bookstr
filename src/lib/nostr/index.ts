
// Re-export core functions
export * from './user';
export * from './profile';
export * from './publish';
export * from './relay';

// Re-export fetch utility
// Don't re-export everything from ./fetch - we'll handle specific exports to avoid conflicts
// export * from './fetch';

// Re-export reactions and replies functions
export * from './fetch/social/interactions';

// Re-export types
export * from './types';

// Handle conflicting exports by re-exporting with different names
// Re-export posts functions, but handle the naming conflict
import { fetchBookPosts } from './posts';
export { 
  fetchBookPosts as fetchBookPostsByUserFromPosts,
  // Export all other functions from posts except fetchBookPosts to avoid conflict
  createBookPost,
  fetchUserPosts
} from './posts';

// Re-export specific functions from fetch to avoid conflicts
import { 
  fetchUserBooks, 
  fetchBooksByISBN, 
  fetchBookByISBN,
  fetchBookReviews,
  fetchBookRatings,
  fetchUserReviews,
  fetchFollowingList,
  fetchUserProfile,
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPosts as fetchBookPostsFromFetch,
  fetchBookActivity
} from './fetch';

// Re-export them all individually
export {
  fetchUserBooks, 
  fetchBooksByISBN, 
  fetchBookByISBN,
  fetchBookReviews,
  fetchBookRatings,
  fetchUserReviews,
  fetchFollowingList,
  fetchUserProfile,
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPostsFromFetch,
  fetchBookActivity
};

// Re-export fetchEventById from fetch/social/fetchEvent with a different name to avoid conflicts
import { fetchEventById as fetchEventByIdFromFetch } from './fetch/social/fetchEvent';
export { fetchEventByIdFromFetch };

// Re-export all from books except fetchEventById to avoid conflict
import { fetchEventById as fetchEventByIdFromBooks } from './books';
// Export the one from books with a different name
export { fetchEventByIdFromBooks };
// Export everything else from books
export * from './books';
