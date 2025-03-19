export interface NostrEventData {
  id?: string;
  pubkey?: string;
  created_at?: number;
  kind?: number;
  tags?: string[][];
  content?: string;
  sig?: string;
}

export interface NostrProfile {
  npub: string;
  pubkey: string;
  name?: string;
  display_name?: string;  // Keep this as snake_case for consistency
  picture?: string;
  about?: string;
  website?: string;
  lud16?: string;
  banner?: string;
  relays: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  description?: string;
  pubDate?: string;
  pageCount?: number;
  categories?: string[];
  readingStatus?: {
    status: 'tbr' | 'reading' | 'finished';
    dateAdded: number;
    rating?: number;
  };
}

export interface BookReview {
  id: string;
  pubkey: string;
  content: string;
  rating?: number;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  bookIsbn?: string;
  bookTitle?: string;
  bookCover?: string;
  replies?: Reply[];
}

export interface Reply {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  parentId: string;
}

export interface Post {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  taggedBook?: {
    isbn: string;
    title: string;
    coverUrl: string;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isSpoiler?: boolean;
  reactions?: {
    count: number;
    userReacted: boolean;
  };
  replies?: Reply[];
}

export interface SocialActivity {
  id: string;
  pubkey: string;
  type: 'review' | 'rating' | 'tbr' | 'reading' | 'finished' | 'post';
  book: Book;
  content?: string;
  rating?: number;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  reactions?: {
    count: number;
    userReacted: boolean;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isSpoiler?: boolean;
  replies?: Reply[];
}

export interface FollowList {
  follows: string[];
}

export type BookActionType = 'tbr' | 'reading' | 'finished';

export const mockPosts: Post[] = [
  {
    id: "post1",
    pubkey: "user1pubkey",
    content: "Just started this amazing book! The world-building is incredible so far.",
    createdAt: Date.now() - 3600000 * 24,
    author: {
      name: "Jane Reader",
      picture: "https://i.pravatar.cc/150?img=1",
      npub: "npub123"
    },
    taggedBook: {
      isbn: "978-0618260249",
      title: "The Lord of the Rings",
      coverUrl: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    id: "post2",
    pubkey: "user2pubkey",
    content: "I can't believe what just happened in chapter 15! The plot twist was unexpected!",
    createdAt: Date.now() - 3600000 * 12,
    author: {
      name: "Book Lover",
      picture: "https://i.pravatar.cc/150?img=2",
      npub: "npub456"
    },
    taggedBook: {
      isbn: "978-0141439518",
      title: "Pride and Prejudice",
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/71Q1tPupnVS._AC_UL600_SR600,600_.jpg"
    },
    isSpoiler: true
  },
  {
    id: "post3",
    pubkey: "user3pubkey",
    content: "Reading under the stars tonight ✨ This dystopian novel feels too real sometimes.",
    createdAt: Date.now() - 3600000 * 5,
    author: {
      name: "Night Reader",
      picture: "https://i.pravatar.cc/150?img=3",
      npub: "npub789"
    },
    taggedBook: {
      isbn: "978-0451524935",
      title: "1984",
      coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1686402559l/61439013.jpg"
    },
    mediaUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop",
    mediaType: "image"
  },
  {
    id: "post4",
    pubkey: "user4pubkey",
    content: "I'm finding this sci-fi comedy absolutely hilarious! 'DON'T PANIC' is solid life advice.",
    createdAt: Date.now() - 3600000 * 2,
    author: {
      name: "Galaxy Traveler",
      picture: "https://i.pravatar.cc/150?img=4",
      npub: "npub101"
    },
    taggedBook: {
      isbn: "978-0345391803",
      title: "The Hitchhiker's Guide to the Galaxy",
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/41tFB3jTGL._SX311_BO1,204,203,200_.jpg"
    }
  }
];

export const DEFAULT_PROFILE: NostrProfile = {
  npub: "npub1Default",
  pubkey: "Default",
  name: "BookVerse User",
  display_name: "Bookworm",
  picture: "https://i.pravatar.cc/300",
  about: "I love books!",
  relays: []
};

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
  BOOK_RATING: 1080,
  REVIEW: 31985, // Updated to the correct kind for reviews
  BOOK_READ: 10073,
  BOOK_READING: 10074,
  BOOK_TBR: 10075,
  BOOK_LIST_REPLY: 1111,  // Kind for replying to book-related events
  POST_REPLY: 1           // Using standard kind 1 for post replies
};
