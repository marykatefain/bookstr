
import { toast } from "@/components/ui/use-toast";

// Types
export interface NostrProfile {
  npub: string;
  pubkey: string;
  name?: string;
  displayName?: string;
  picture?: string;
  about?: string;
}

export interface NostrEvent {
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
  isbn?: string;
  pubDate?: string;
  pageCount?: number;
  categories?: string[];
}

export interface BookReview {
  id: string;
  bookId: string;
  pubkey: string;
  rating: number;
  content: string;
  createdAt: number;
}

export interface ReadingStatus {
  bookId: string;
  status: 'want-to-read' | 'reading' | 'read' | 'dnf';
  dateAdded: number;
  dateStarted?: number;
  dateFinished?: number;
  rating?: number;
}

// Mock data for development
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

// Local storage keys
const NOSTR_USER_KEY = 'bookverse_nostr_user';

// Nostr login state management
let currentUser: NostrProfile | null = null;

// Initialize Nostr
export async function initNostr() {
  try {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(NOSTR_USER_KEY);
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      return currentUser;
    }
    return null;
  } catch (error) {
    console.error("Failed to initialize Nostr:", error);
    return null;
  }
}

// Login with Nostr
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

    // Request public key
    const pubkey = await window.nostr.getPublicKey();
    
    if (!pubkey) {
      toast({
        title: "Login failed",
        description: "Could not get public key from Nostr extension",
        variant: "destructive",
      });
      return null;
    }

    // Create npub from pubkey
    const npub = pubkeyToNpub(pubkey);

    // Create user profile
    const userProfile: NostrProfile = {
      npub,
      pubkey,
      // These would normally be fetched from Nostr, using mockups for now
      name: "Nostr User",
      displayName: "Nostr Book Lover",
      picture: "https://i.pravatar.cc/300",
      about: "I love reading books and sharing my thoughts on Nostr!"
    };

    // Save user to local storage
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

// Logout from Nostr
export function logoutNostr() {
  localStorage.removeItem(NOSTR_USER_KEY);
  currentUser = null;
  toast({
    title: "Logged out",
    description: "You've been logged out from Nostr",
  });
}

// Get current user
export function getCurrentUser(): NostrProfile | null {
  if (currentUser) return currentUser;
  
  const savedUser = localStorage.getItem(NOSTR_USER_KEY);
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    return currentUser;
  }
  
  return null;
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

// Utility functions
function pubkeyToNpub(pubkey: string): string {
  // In a real app, this would convert a pubkey to npub format
  // For now, we'll just return a mock npub
  return `npub1${pubkey.substring(0, 20)}`;
}

// Declare global Window interface with Nostr
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>;
      getRelays: () => Promise<Record<string, { read: boolean; write: boolean }>>;
    };
  }
}
