
// Re-export all fetch functions

// Book fetch functions
import { 
  fetchUserBooks, 
  fetchBooksByISBN, 
  fetchBookByISBN
} from './book';

// Review fetch functions
import {
  fetchBookReviews,
  fetchBookRatings,
  fetchUserReviews
} from './reviewFetch';

// Profile fetch functions
import {
  fetchFollowingList,
  fetchUserProfile
} from './profileFetch';

// Social fetch functions
import {
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPosts,
  fetchBookActivity
} from './social';

// Event fetch function
import { fetchEventById } from './social/fetchEvent';

// Interactions fetch functions
import {
  fetchReactionsForEvent as fetchReactions,
  fetchRepliesForEvent as fetchReplies,
  batchFetchReactions,
  batchFetchReplies
} from './social/interactions';

export {
  // Book functions
  fetchUserBooks,
  fetchBooksByISBN,
  fetchBookByISBN,
  
  // Review functions
  fetchBookReviews,
  fetchBookRatings,
  fetchUserReviews,
  
  // Profile functions
  fetchFollowingList,
  fetchUserProfile,
  
  // Social functions
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPosts,
  fetchBookActivity,
  
  // Event function
  fetchEventById,
  
  // Interactions functions
  fetchReactions,
  fetchReplies,
  batchFetchReactions,
  batchFetchReplies
};
