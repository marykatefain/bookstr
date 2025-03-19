
// Export types
export * from "./types";

// Export user management functions
export {
  initNostr,
  loginWithNostr,
  logoutNostr,
  getCurrentUser,
  isLoggedIn
} from "./user";

// Export relay management functions
export {
  DEFAULT_RELAYS,
  getUserRelays,
  addRelay,
  removeRelay,
  resetRelays
} from "./relay";

// Export profile functions
export { fetchProfileData } from "./profile";

// Export publishing functions
export { publishToNostr, updateNostrEvent } from "./publish";

// Export posts functions
export { createBookPost, fetchPosts, fetchBookPosts, fetchUserPosts } from "./posts";

// Export book-specific functions
export {
  addBookToTBR,
  markBookAsReading,
  markBookAsRead,
  rateBook,
  reviewBook,
  reactToContent,
  replyToContent,
  followUser,
  addBookToList,
  updateBookInList
} from "./books";

// Export fetch functions
export {
  fetchUserBooks,
  fetchBooksByISBN,
  fetchBookByISBN,
  fetchBookReviews,
  fetchBookRatings,
  fetchFollowingList,
  fetchUserProfile,
  fetchSocialFeed,
  fetchGlobalSocialFeed,
  fetchUserReviews,
  ensureBookMetadata,
  fetchBookActivity
} from "./fetch";

// Export mock data
export { mockBooks } from "./mockData";
