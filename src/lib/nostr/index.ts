
// Re-export core functions
export * from './user';
export * from './profile';
// We'll handle publish exports separately
// Don't export everything from './publish'
export {
  publishToNostr,
  updateNostrEvent
} from './publish';
export * from './relay';

// Re-export fetch utility
// Don't re-export everything from ./fetch - we'll handle specific exports to avoid conflicts
// export * from './fetch';

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

// Import specific functions from books to avoid conflicts
import { 
  fetchEventById as fetchEventByIdFromBooks, 
  fetchReactions as fetchReactionsFromBooks, 
  fetchReplies as fetchRepliesFromBooks,
  followUser,
  addBookToTBR,
  markBookAsReading,
  markBookAsRead,
  rateBook,
  reviewBook,
  replyToContent,
  updateBookInList,
  addBookToList,
  removeBookFromList
} from './books';

// Export the ones from books with different names to avoid ambiguity
export { 
  fetchEventByIdFromBooks,
  fetchReactionsFromBooks,
  fetchRepliesFromBooks
};

// Export other functions from books individually
export {
  followUser,
  addBookToTBR,
  markBookAsReading,
  markBookAsRead,
  rateBook,
  reviewBook,
  replyToContent,
  updateBookInList,
  addBookToList,
  removeBookFromList
};

// Handle the conflict with interactions exports
import { 
  fetchReactions as fetchReactionsOriginal,
  fetchReplies as fetchRepliesOriginal,
  batchFetchReactions,
  batchFetchReplies
} from './fetch/social/interactions';

// Re-export with different names to avoid ambiguity
export { 
  fetchReactionsOriginal as fetchReactionsFromInteractions,
  fetchRepliesOriginal as fetchRepliesFromInteractions,
  batchFetchReactions,
  batchFetchReplies
};

// Import reactToContent from publish separately and re-export with a different name
import { reactToContent as reactToContentFromPublish } from './publish';
export { reactToContentFromPublish };

// Now export the base functions that components are directly using
// Export fetchReactions directly for components to use
export { fetchReactionsOriginal as fetchReactions } from './fetch/social/interactions';

// Export fetchReplies directly for components to use
export { fetchRepliesOriginal as fetchReplies } from './fetch/social/interactions';

// Export fetchEventById directly for components to use
export { fetchEventById } from './fetch/social/fetchEvent';

// Export reactToContent directly for components to use
export { reactToContent } from './publish';
