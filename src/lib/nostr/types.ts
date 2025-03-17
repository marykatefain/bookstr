// Types
export interface NostrProfile {
  npub?: string;
  pubkey?: string;
  name?: string;
  displayName?: string;
  nip05?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  lud06?: string;
  lud16?: string;
  relays?: string[];
}

// Rename our local interface to avoid conflict with imported type
export interface NostrEventData {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  isbn: string;
  pubDate: string;
  pageCount: number;
  categories: string[];
}

// Nostr event kinds
export const NOSTR_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMENDED_SERVER: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  DELETION: 5,
  REPOST: 6,
  REACTION: 7,
  BADGE_AWARD: 8,
  GENERIC_LIST: 30000,
  BOOK_READ: 30001, // Custom kind for books read
  BOOK_TBR: 30002,  // Custom kind for to-be-read books
  LONG_FORM: 30023,
  BOOK_RATING: 31337, // As per proposed NIP for ratings
  REVIEW: 1111 // NIP-22 Reviews
};

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverUrl: "https://m.media-amazon.com/images/I/81tCtHFtOJL._AC_UF1000,1000_QL80_.jpg",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    isbn: "9780525559474",
    pubDate: "2020-08-13",
    pageCount: 304,
    categories: ["Fiction", "Fantasy", "Contemporary"]
  },
  {
    id: "2",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverUrl: "https://m.media-amazon.com/images/I/91uFdkCJmAL._AC_UF1000,1000_QL80_.jpg",
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.",
    isbn: "9780593135204",
    pubDate: "2021-05-04",
    pageCount: 496,
    categories: ["Science Fiction", "Space", "Adventure"]
  },
  {
    id: "3",
    title: "Circe",
    author: "Madeline Miller",
    coverUrl: "https://m.media-amazon.com/images/I/71Xn3zQqlbL._AC_UF1000,1000_QL80_.jpg",
    description: "In the house of Helios, god of the sun and mightiest of the Titans, a daughter is born. But Circe is a strange child—not powerful, like her father, nor viciously alluring like her mother.",
    isbn: "9780316556347",
    pubDate: "2018-04-10",
    pageCount: 400,
    categories: ["Fantasy", "Mythology", "Historical Fiction"]
  },
  {
    id: "4",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    coverUrl: "https://m.media-amazon.com/images/I/71uH11mYgHL._AC_UF1000,1000_QL80_.jpg",
    description: "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.",
    isbn: "9781501139239",
    pubDate: "2017-06-13",
    pageCount: 400,
    categories: ["Fiction", "Historical Fiction", "LGBT"]
  },
  {
    id: "5",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    coverUrl: "https://m.media-amazon.com/images/I/61rJlsXaYDL._AC_UF1000,1000_QL80_.jpg",
    description: "When nineteen-year-old huntress Feyre kills a wolf in the woods, a terrifying creature arrives to demand retribution.",
    isbn: "9781635575569",
    pubDate: "2015-05-05",
    pageCount: 419,
    categories: ["Fantasy", "Romance", "Young Adult"]
  },
  {
    id: "6",
    title: "The Invisible Life of Addie LaRue",
    author: "V.E. Schwab",
    coverUrl: "https://m.media-amazon.com/images/I/91vFYh5aBVL._AC_UF1000,1000_QL80_.jpg",
    description: "A life no one will remember. A story you will never forget. France, 1714: In a moment of desperation, a young woman makes a Faustian bargain to live forever―and is cursed to be forgotten by everyone she meets.",
    isbn: "9780765387561",
    pubDate: "2020-10-06",
    pageCount: 448,
    categories: ["Fantasy", "Historical Fiction", "Romance"]
  }
];

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: Partial<NostrEventData>) => Promise<any>;
      getRelays: () => Promise<Record<string, { read: boolean; write: boolean }>>;
    };
  }
}
