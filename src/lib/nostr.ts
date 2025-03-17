
import { toast } from "@/hooks/use-toast";

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

// Define Book interface that was missing
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

// Default relay
export const DEFAULT_RELAYS = ["wss://ditto.pub/relay"];
let userRelays = [...DEFAULT_RELAYS];

// Local storage keys
const NOSTR_USER_KEY = 'bookverse_nostr_user';
const NOSTR_RELAYS_KEY = 'bookverse_nostr_relays';

// Nostr login state management
let currentUser: NostrProfile | null = null;

// Helper to parse profile content
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

// Initialize Nostr
export async function initNostr() {
  try {
    // Load saved relays
    const savedRelays = localStorage.getItem(NOSTR_RELAYS_KEY);
    if (savedRelays) {
      userRelays = JSON.parse(savedRelays);
    }

    // Check if user is already logged in
    const savedUser = localStorage.getItem(NOSTR_USER_KEY);
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      
      // If logged in, try to fetch latest profile data
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

// Connect to relay and fetch data
async function connectToRelays(relays: string[] = userRelays): Promise<WebSocket[]> {
  const connections: WebSocket[] = [];
  
  for (const relayUrl of relays) {
    try {
      const socket = new WebSocket(relayUrl);
      
      // Wait for connection to establish
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
        
        // Set timeout
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

// Fetch profile data from relays
export async function fetchProfileData(pubkey: string): Promise<Partial<NostrProfile> | null> {
  try {
    const relayConnections = await connectToRelays();
    
    // Create a promise that will be resolved with the profile data
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        relayConnections.forEach(socket => socket.close());
        resolve(null);
      }, 5000);
      
      // Handle messages from relays
      relayConnections.forEach(socket => {
        // Subscribe to Kind 0 events for the pubkey
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
            // Check if it's an EVENT message with our subscription ID
            if (message[0] === "EVENT" && message[1] === subscriptionId) {
              const profileEvent = message[2] as NostrEvent;
              
              if (profileEvent.kind === 0 && profileEvent.pubkey === pubkey) {
                // Parse profile content
                const profileData = parseProfileContent(profileEvent.content);
                
                // Close connections and resolve promise
                clearTimeout(timeout);
                relayConnections.forEach(s => s.close());
                resolve({
                  ...profileData,
                  pubkey
                });
              }
            }
            
            // Handle EOSE (End of Stored Events)
            if (message[0] === "EOSE" && message[1] === subscriptionId) {
              // If we get EOSE and haven't found a profile, close one connection
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

// Update current user profile with new data
function updateUserProfile(profileData: Partial<NostrProfile>): void {
  if (!currentUser || !profileData.pubkey) return;
  
  currentUser = {
    ...currentUser,
    ...profileData
  };
  
  localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
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

    // Create initial user profile
    let userProfile: NostrProfile = {
      npub,
      pubkey,
      // Default values until we fetch from relay
      name: "Nostr User",
      displayName: "Nostr Book Lover",
      picture: "https://i.pravatar.cc/300",
      about: "I love reading books and sharing my thoughts on Nostr!",
      relays: [...userRelays]
    };

    // Try to fetch profile data from relays
    const profileData = await fetchProfileData(pubkey);
    if (profileData) {
      userProfile = {
        ...userProfile,
        ...profileData
      };
    }

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

// Get user relays
export function getUserRelays(): string[] {
  return userRelays;
}

// Add a relay
export function addRelay(relayUrl: string): boolean {
  if (userRelays.includes(relayUrl)) {
    return false;
  }
  
  try {
    // Test connection to relay
    const ws = new WebSocket(relayUrl);
    ws.onopen = () => {
      userRelays.push(relayUrl);
      localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
      ws.close();
      
      // Update user relays in profile
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

// Remove a relay
export function removeRelay(relayUrl: string): boolean {
  if (!userRelays.includes(relayUrl) || relayUrl === DEFAULT_RELAYS[0]) {
    // Don't allow removing the default relay
    return false;
  }
  
  userRelays = userRelays.filter(r => r !== relayUrl);
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  // Update user relays in profile
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

// Reset relays to default
export function resetRelays(): void {
  userRelays = [...DEFAULT_RELAYS];
  localStorage.setItem(NOSTR_RELAYS_KEY, JSON.stringify(userRelays));
  
  // Update user relays in profile
  if (currentUser) {
    currentUser.relays = [...userRelays];
    localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
  }
  
  toast({
    title: "Relays reset",
    description: "Your relays have been reset to default",
  });
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
