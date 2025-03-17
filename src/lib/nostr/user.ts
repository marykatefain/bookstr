
import { toast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { NostrProfile } from "./types";
import { loadRelaysFromStorage, getUserRelays } from "./relay";
import { fetchProfileData } from "./profile";

const NOSTR_USER_KEY = 'bookverse_nostr_user';
let currentUser: NostrProfile | null = null;

export async function initNostr() {
  try {
    // Load relays first
    loadRelaysFromStorage();

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
      relays: [...getUserRelays()]
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

export function updateUserProfile(profileData: Partial<NostrProfile>): void {
  if (!currentUser || !profileData.pubkey) return;
  
  currentUser = {
    ...currentUser,
    ...profileData
  };
  
  localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
}

function pubkeyToNpub(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey);
  } catch (error) {
    console.error("Error converting pubkey to npub:", error);
    return `npub1${pubkey.substring(0, 20)}`;
  }
}
