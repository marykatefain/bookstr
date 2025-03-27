// Nostr event kinds
export const NOSTR_KINDS = {
  SET_METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  DIRECT_MESSAGE: 4,
  DELETE: 5,
  REACTION: 7, // Add this for NIP-25 reactions
  CHANNEL_CREATION: 40,
  CHANNEL_MESSAGE: 42,
  CHANNEL_HIDE_MESSAGE: 43,
  CHANNEL_MUTE_USER: 44,
  BOOK_TBR: 30001,
  BOOK_READING: 30002,
  BOOK_READ: 30003,
  BOOK_RATING: 30004,
  REVIEW: 30008,
  BOOK_LIST: 30009
};

// Predefined book list names
export const BOOK_LIST_NAMES = [
  "To Be Read",
  "Currently Reading",
  "Read"
];
