
// Export user functions
export {
  getCurrentUser,
  isLoggedIn,
  loginWithNostr,
  logoutNostr
} from "./user";

// Export relay functions
export {
  addRelay,
  removeRelay,
  getUserRelays,
  ensureConnections,
  connectToRelays,
  getActiveConnections,
  getConnectionStatus,
  DEFAULT_RELAYS,
  resetRelays,
  loadRelaysFromStorage
} from "./relay";

// Export books functions
export {
  addBookToTBR,
  markBookAsReading,
  markBookAsRead,
  rateBook,
  reviewBook,
  addBookToList,
  updateBookInList,
  removeBookFromList,
  reactToContent,
  fetchReactions,
  replyToContent,
  fetchReplies,
  fetchEventById,
  followUser
} from "./books";

// Export events functions
export {
  fetchEvents,
  fetchPosts,
  fetchUserPosts,
  createBookPost
} from "./posts";

// Export types
export type { Book } from "./types";

// Export social feed functions
export {
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchBookPosts,
  fetchBookActivity
} from "./fetch/social";

// Export fetch functions
export {
  fetchUserBooks,
  fetchBookByISBN,
  fetchBookReviews,
  fetchBookRatings,
  fetchSingleBookReview,
  fetchUserReviews
} from "./fetch";

// Export profile functions
export {
  fetchFollowingList,
  fetchUserProfile
} from "./fetch/profileFetch";

export {
  fetchProfileData
} from "./profile";

// Export mock data
export { mockBooks } from "./types/mock";

// Export initialization function
export const initNostr = async () => {
  // Check for previously saved user
  const savedUser = localStorage.getItem('nostr_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      return user;
    } catch (error) {
      console.error("Error parsing saved user:", error);
    }
  }
  return null;
};
