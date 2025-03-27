
// Constants used across the application
export const NOSTR_KINDS = {
  SET_METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_RELAY: 2,
  CONTACTS: 3,
  DIRECT_MESSAGE: 4,
  DELETION: 5,
  REPOST: 6,
  REACTION: 7,
  BADGE: 8,
  LONG_FORM: 30023,
  BOOK_METADATA: 73,
  GENERIC_LIST: 30000,
  BOOK_RATING: 31985, // Updated: Changed from 1080 to match REVIEW kind
  REVIEW: 31985, // This is the correct kind for reviews and ratings
  BOOK_READ: 10073,
  BOOK_READING: 10074,
  BOOK_TBR: 10075,
  BOOK_LIST_REPLY: 1111,  // Kind for replying to book-related events
  POST_REPLY: 1           // Using standard kind 1 for post replies
};
