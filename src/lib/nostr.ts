import { toast } from "@/hooks/use-toast";
import { SimplePool, nip19, validateEvent, getEventHash } from "nostr-tools";
import type { UnsignedEvent, Event } from "nostr-tools";

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
  BOOK_RATING: 31337 // As per proposed NIP for ratings
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

export const DEFAULT_RELAYS = ["wss://ditto.pub/relay"];
let userRelays = [...DEFAULT_RELAYS];

const NOSTR_USER_KEY = 'bookverse_nostr_user';
const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';

let currentUser: NostrProfile | null = null;

const parseProfileContent = (content: string): Partial<NostrProfile> => {
  try {
    const profileData = JSON.parse(content);
    return {
      name: profileData.name,
      displayName: profileData.display_name || profileData.displayName,
      picture: profileData.picture,
      about: profileData.about
    };
  } catch (error) {
    console.error("Failed to parse profile data:", error);
    return {};
  }
};

export async function initNostr() {
  try {
    const savedRelays = localStorage.getItem(NOSTR_RELAYS_KEY);
    if (savedRelays) {
      userRelays = JSON.parse(savedRelays);
    }

    const savedUser = localStorage.getItem(NOSTR_USER_KEY);
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      
      if (currentUser?.pubkey) {
        fetchProfileData(currentUser.pubkey)
          .then(profileData => {
            if (profileData) {
              updateUserProfile(profileData);
            }
          })
          .catch(err => console.error("Error fetching profile on init:", err));
      }
      
      return currentUser;
    }
    return null;
  } catch (error) {
    console.error("Failed to initialize Nostr:", error);
    return null;
  }
}

async function connectToRelays(relays: string[] = userRelays): Promise<WebSocket[]> {
  const connections: WebSocket[] = [];
  
  for (const relayUrl of relays) {
    try {
      const socket = new WebSocket(relayUrl);
      
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
        
        setTimeout(() => reject(new Error(`Connection timeout for ${relayUrl}`)), 5000);
      });
      
      connections.push(socket);
    } catch (error) {
      console.error(`Failed to connect to ${relayUrl}:`, error);
    }
  }
  
  if (connections.length === 0) {
    throw new Error("Could not connect to any relays");
  }
  
  return connections;
}

export async function fetchProfileData(pubkey: string): Promise<Partial<NostrProfile> | null> {
  try {
    const relayConnections = await connectToRelays();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        relayConnections.forEach(socket => socket.close());
        resolve(null);
      }, 5000);
      
      relayConnections.forEach(socket => {
        const subscriptionId = `profile-${Math.random().toString(36).substring(2, 15)}`;
        const requestMessage = JSON.stringify([
          "REQ", 
          subscriptionId,
          {
            "kinds": [0],
            "authors": [pubkey],
            "limit": 1
          }
        ]);
        
        socket.send(requestMessage);
        
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message[0] === "EVENT" && message[1] === subscriptionId) {
              const profileEvent = message[2] as NostrEventData;
              
              if (profileEvent.kind === 0 && profileEvent.pubkey === pubkey) {
                const profileData = parseProfileContent(profileEvent.content);
                
                clearTimeout(timeout);
                relayConnections.forEach(s => s.close());
                resolve({
                  ...profileData,
                  pubkey
                });
              }
            }
            
            if (message[0] === "EOSE" && message[1] === subscriptionId) {
              socket.close();
            }
          } catch (error) {
            console.error("Error processing relay message:", error);
          }
        };
        
        socket.onerror = (error) => {
          console.error("Relay connection error:", error);
          socket.close();
        };
      });
    });
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return null;
  }
}

function updateUserProfile(profileData: Partial<NostrProfile>): void {
  if (!currentUser || !profileData.pubkey) return;
  
  currentUser = {
    ...currentUser,
    ...profileData
  };
  
  localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
}

export async function loginWithNostr() {
  try {
    if (typeof window.nostr === 'undefined') {
      toast({
        title: "Nostr extension not found",
        description: "Please install a Nostr extension like nos2x or Alby",
        variant: "destructive",
      });
      return null;
    }

    const pubkey = await window.nostr.getPublicKey();
    
    if (!pubkey) {
      toast({
        title: "Login failed",
        description: "Could not get public key from Nostr extension",
        variant: "destructive",
      });
      return null;
    }

    const npub = pubkeyToNpub(pubkey);

    let userProfile: NostrProfile = {
      npub,
      pubkey,
      name: "Nostr User",
      displayName: "Nostr Book Lover",
      picture: "https://i.pravatar.cc/300",
      about: "I love reading books and sharing my thoughts on Nostr!",
      relays: [...userRelays]
    };

    const profileData = await fetchProfileData(pubkey);
    if (profileData) {
      userProfile = {
        ...userProfile,
        ...profileData
      };
    }

    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(userProfile));
    currentUser = userProfile;

    toast({
      title: "Login successful",
      description: "You're now logged in with Nostr",
    });

    return userProfile;
  } catch (error) {
    console.error("Nostr login error:", error);
    toast({
      title: "Login failed",
      description: "Error connecting to Nostr",
      variant: "destructive",
    });
    return null;
  }
}

export function getUserRelays(): string[] {
  return userRelays;
}

export function addRelay(relayUrl: string): boolean {
  if (userRelays.includes(relayUrl)) {
    return false;
  }
  
  try {
    const ws = new WebSocket(relayUrl);
    ws.onopen = () => {
      userRelays.push(relayUrl);
      localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
      ws.close();
      
      if (currentUser) {
        currentUser.relays = [...userRelays];
        localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
      }
      
      toast({
        title: "Relay added",
        description: `Added ${relayUrl} to your relays`,
      });
    };
    
    ws.onerror = () => {
      toast({
        title: "Invalid relay",
        description: `Could not connect to ${relayUrl}`,
        variant: "destructive",
      });
      ws.close();
    };
    
    return true;
  } catch (error) {
    console.error("Error adding relay:", error);
    return false;
  }
}

export function removeRelay(relayUrl: string): boolean {
  if (!userRelays.includes(relayUrl) || relayUrl === DEFAULT_RELAYS[0]) {
    return false;
  }
  
  userRelays = userRelays.filter(r => r !== relayUrl);
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  if (currentUser) {
    currentUser.relays = [...userRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  toast({
    title: "Relay removed",
    description: `Removed ${relayUrl} from your relays`,
  });
  
  return true;
}

export function resetRelays(): void {
  userRelays = [...DEFAULT_RELAYS];
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  if (currentUser) {
    currentUser.relays = [...userRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  toast({
    title: "Relays reset",
    description: "Your relays have been reset to default",
  });
}

export function logoutNostr() {
  localStorage.removeItem(NOSTR_USER_KEY);
  currentUser = null;
  toast({
    title: "Logged out",
    description: "You've been logged out from Nostr",
  });
}

export function getCurrentUser(): NostrProfile | null {
  if (currentUser) return currentUser;
  
  const savedUser = localStorage.getItem(NOSTR_USER_KEY);
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    return currentUser;
  }
  
  return null;
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

function pubkeyToNpub(pubkey: string): string {
  return `npub1${pubkey.substring(0, 20)}`;
}

/**
 * Publish an event to Nostr relays
 */
export async function publishToNostr(event: Partial<NostrEventData>): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in with Nostr to perform this action",
        variant: "destructive"
      });
      return null;
    }

    if (typeof window.nostr === 'undefined') {
      toast({
        title: "Nostr extension not found",
        description: "Please install a Nostr extension like nos2x or Alby",
        variant: "destructive",
      });
      return null;
    }

    // Prepare the event
    const unsignedEvent: UnsignedEvent = {
      kind: event.kind || NOSTR_KINDS.TEXT_NOTE,
      created_at: Math.floor(Date.now() / 1000),
      tags: event.tags || [],
      content: event.content || "",
      pubkey: currentUser?.pubkey || ""
    };

    // Sign the event with the extension
    const signedEvent = await window.nostr.signEvent(unsignedEvent);
    
    if (!signedEvent) {
      throw new Error("Failed to sign event");
    }

    // Validate the event
    const eventHash = getEventHash(signedEvent);
    if (eventHash !== signedEvent.id) {
      throw new Error("Event validation failed: incorrect hash");
    }

    const isValid = validateEvent(signedEvent);
    
    if (!isValid) {
      throw new Error("Event validation failed: invalid signature");
    }

    // Create a pool for publishing to multiple relays
    const pool = new SimplePool();
    const relayUrls = getUserRelays();
    
    // Publish to relays
    try {
      // Use Promise.allSettled instead of Promise.any for better compatibility
      const results = await Promise.allSettled(
        // Fix: Ensure we're passing each URL separately, not the whole array
        relayUrls.map(url => pool.publish(url, signedEvent))
      );
      
      // Check if at least one relay accepted the event
      const success = results.some(result => 
        result.status === 'fulfilled'
      );
      
      if (success) {
        toast({
          title: "Published successfully",
          description: "Your action has been published to Nostr"
        });
        
        return signedEvent.id;
      } else {
        throw new Error("Failed to publish to any relay");
      }
    } catch (error) {
      console.error("Failed to publish to relays:", error);
      throw error;
    } finally {
      // Clean up connections
      pool.close(relayUrls);
    }
  } catch (error) {
    console.error("Error publishing to Nostr:", error);
    
    toast({
      title: "Publishing failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    
    return null;
  }
}

/**
 * Add a book to the "Want to Read" list
 */
export async function addBookToTBR(book: Book): Promise<string | null> {
  const event: Partial<NostrEventData> = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "tbr"],
      ["t", "books"],
      ["item", book.isbn, book.title, book.author]
    ],
    content: `Added ${book.title} by ${book.author} to my TBR list`
  };
  
  return publishToNostr(event);
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(book: Book): Promise<string | null> {
  const now = new Date().toISOString();
  
  const event: Partial<NostrEventData> = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "reading"],
      ["t", "books"],
      ["item", book.isbn, book.title, book.author],
      ["started_at", now]
    ],
    content: `Started reading ${book.title} by ${book.author}`
  };
  
  return publishToNostr(event);
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: Book, rating?: number): Promise<string | null> {
  const now = new Date().toISOString();
  
  const tags = [
    ["d", "read-books"],
    ["t", "books"],
    ["item", book.isbn, book.title, book.author],
    ["finished_at", now]
  ];
  
  // Add rating if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  const event: Partial<NostrEventData> = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags,
    content: `Finished reading ${book.title} by ${book.author}${rating ? ` - Rating: ${rating}/5` : ''}`
  };
  
  return publishToNostr(event);
}

/**
 * Rate a book separately (using the proposed NIP for ratings)
 */
export async function rateBook(book: Book, rating: number): Promise<string | null> {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  
  // Using the proposed NIP format for ratings
  const event: Partial<NostrEventData> = {
    kind: NOSTR_KINDS.BOOK_RATING,
    tags: [
      ["d", `rating:${book.isbn}`],
      ["t", "book-rating"],
      ["subject", book.isbn, book.title, book.author],
      ["r", rating.toString()],
      ["context", "bookverse"]
    ],
    content: `${rating} Stars${rating < 3 ? " - Could be better" : rating < 5 ? " - Pretty good" : " - Amazing!"}`
  };
  
  return publishToNostr(event);
}

/**
 * Post a review for a book
 */
export async function reviewBook(book: Book, reviewText: string, rating?: number): Promise<string | null> {
  const tags = [
    ["t", "book-review"],
    ["book", book.isbn, book.title, book.author]
  ];
  
  // Add rating tag if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  // For longer reviews, use Long Form Content kind
  const useNIP23 = reviewText.length > 280;
  
  const event: Partial<NostrEventData> = {
    kind: useNIP23 ? NOSTR_KINDS.LONG_FORM : NOSTR_KINDS.TEXT_NOTE,
    tags,
    content: useNIP23 
      ? JSON.stringify({
          title: `Review: ${book.title}`,
          published_at: Math.floor(Date.now() / 1000),
          content: reviewText
        })
      : reviewText
  };
  
  return publishToNostr(event);
}

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: Partial<NostrEventData>) => Promise<Event>;
      getRelays: () => Promise<Record<string, { read: boolean; write: boolean }>>;
    };
  }
}
