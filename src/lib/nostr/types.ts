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
  display_name?: string;
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
    status: 'tbr' | 'reading' | 'read';
    dateAdded: number;
  };
}

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    isbn: "978-0618260264",
    coverUrl: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg",
    description: "The Lord of the Rings is an epic high-fantasy novel written by English author and scholar J. R. R. Tolkien.",
    pubDate: "1954",
    pageCount: 1178,
    categories: ["Fantasy", "Fiction"]
  },
  {
    id: "2",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "978-0141439518",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/I/71Q1tPupnVS._AC_UL600_SR600,600_.jpg",
    description: "Pride and Prejudice is an 1813 novel of manners by Jane Austen.",
    pubDate: "1813",
    pageCount: 279,
    categories: ["Fiction", "Romance"]
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    isbn: "978-0451524935",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1686402559l/61439013.jpg",
    description: "Nineteen Eighty-Four is a dystopian social science fiction novel and cautionary tale written by English author George Orwell.",
    pubDate: "1949",
    pageCount: 328,
    categories: ["Science Fiction", "Dystopian"]
  },
  {
    id: "4",
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    isbn: "978-0345391803",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/I/41tFB3jTGL._SX311_BO1,204,203,200_.jpg",
    description: "The Hitchhiker's Guide to the Galaxy is a comedy science fiction series created by Douglas Adams.",
    pubDate: "1979",
    pageCount: 224,
    categories: ["Science Fiction", "Comedy"]
  },
  {
    id: "5",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0446310789",
    coverUrl: "https://m.media-amazon.com/images/I/51wB43ZyKjL._AC_UF1000,1000_QL80_.jpg",
    description: "To Kill a Mockingbird is a novel by Harper Lee published in 1960.",
    pubDate: "1960",
    pageCount: 281,
    categories: ["Fiction", "Classics"]
  },
  {
    id: "6",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0743273565",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1490528560l/4671._SY475_.jpg",
    description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald.",
    pubDate: "1925",
    pageCount: 180,
    categories: ["Fiction", "Classics"]
  },
  {
    id: "7",
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    isbn: "978-0061120035",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327755874l/3225.jpg",
    description: "One Hundred Years of Solitude is a 1967 novel by Gabriel García Márquez.",
    pubDate: "1967",
    pageCount: 417,
    categories: ["Fiction", "Magical Realism"]
  },
  {
    id: "8",
    title: "Moby Dick",
    author: "Herman Melville",
    isbn: "978-0143039549",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327754750l/764308.jpg",
    description: "Moby-Dick is an 1851 novel by American writer Herman Melville.",
    pubDate: "1851",
    pageCount: 635,
    categories: ["Fiction", "Adventure"]
  },
  {
    id: "9",
    title: "War and Peace",
    author: "Leo Tolstoy",
    isbn: "978-0140444179",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1344920234l/656.jpg",
    description: "War and Peace is a novel by the Russian author Leo Tolstoy, published serially, then in its entirety in 1869.",
    pubDate: "1869",
    pageCount: 1225,
    categories: ["Fiction", "Historical"]
  },
  {
    id: "10",
    title: "The Odyssey",
    author: "Homer",
    isbn: "978-0140268867",
    coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1389743475l/1381.jpg",
    description: "The Odyssey is one of two major ancient Greek epic poems attributed to Homer.",
    pubDate: "8th century BC",
    pageCount: 384,
    categories: ["Classics", "Poetry"]
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
  BOOK_METADATA: 30073,
  GENERIC_LIST: 30000,
  BOOK_RATING: 7000,
  REVIEW: 1985
};
