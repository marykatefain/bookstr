
import { toast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { NostrProfile } from "./types";
import { loadRelaysFromStorage, getUserRelays } from "./relay";
import { fetchProfileData } from "./profile";
import { NOSTR_KINDS } from "./types/constants";
import { publishToNostr } from "./publish";

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
      console.error("Nostr extension not found");
      toast({
        title: "Nostr extension not found",
        description: "Please install a Nostr extension like nos2x or Alby",
        variant: "destructive",
      });
      return null;
    }

    if (typeof window.nostr.signEvent !== 'function') {
      console.error("Nostr extension missing signEvent function");
      toast({
        title: "Incompatible Nostr extension",
        description: "Your Nostr extension doesn't support the required functions",
        variant: "destructive",
      });
      return null;
    }

    console.log("Trying to get public key from Nostr extension");
    const pubkey = await window.nostr.getPublicKey();
    
    if (!pubkey) {
      console.error("Failed to get public key from Nostr extension");
      toast({
        title: "Login failed",
        description: "Could not get public key from Nostr extension",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Got public key: ${pubkey}`);
    const npub = pubkeyToNpub(pubkey);

    let userProfile: NostrProfile = {
      npub,
      pubkey,
      name: "Nostr User",
      display_name: "Nostr Book Lover",
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

    console.log("Successfully logged in with Nostr:", userProfile);
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
  console.log("User logged out from Nostr");
  toast({
    title: "Logged out",
    description: "You've been logged out from Nostr",
  });
}

export function getCurrentUser(): NostrProfile | null {
  if (currentUser) return currentUser;
  
  const savedUser = localStorage.getItem(NOSTR_USER_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      return currentUser;
    } catch (e) {
      console.error("Error parsing saved user:", e);
      localStorage.removeItem(NOSTR_USER_KEY);
      return null;
    }
  }
  
  return null;
}

export function isLoggedIn(): boolean {
  const user = getCurrentUser();
  const result = user !== null;
  if (!result) {
    console.log("User is not logged in");
  }
  return result;
}

export function updateUserProfile(profileData: Partial<NostrProfile>): void {
  if (!currentUser || !profileData.pubkey) return;
  
  currentUser = {
    ...currentUser,
    ...profileData
  };
  
  localStorage.setItem(NOSTR_USER_KEY, JSON.stringify(currentUser));
}

// New function to update user profile via Nostr event
export async function updateUserProfileEvent(displayName: string, bio: string): Promise<string | null> {
  if (!isLoggedIn()) {
    toast({
      title: "Login required",
      description: "You must be logged in to update your profile",
      variant: "destructive"
    });
    return null;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("User not logged in");

    // Get the latest profile data
    const latestProfile = await fetchProfileData(currentUser.pubkey);
    
    // Prepare the content by parsing existing profile data
    let profileContent: any = {};
    
    if (latestProfile?.content) {
      try {
        profileContent = JSON.parse(latestProfile.content);
      } catch (e) {
        console.error("Failed to parse existing profile content:", e);
        // If we can't parse the content, create a basic structure from what we know
        profileContent = {
          name: latestProfile.name || currentUser.name,
          display_name: latestProfile.display_name || currentUser.display_name,
          picture: latestProfile.picture || currentUser.picture,
          about: latestProfile.about || currentUser.about
        };
      }
    } else if (currentUser) {
      // Use current user data as fallback
      profileContent = {
        name: currentUser.name,
        display_name: currentUser.display_name,
        picture: currentUser.picture,
        about: currentUser.about
      };
    }
    
    // Update only the specific fields
    profileContent.display_name = displayName;
    profileContent.about = bio;
    
    // Create the event
    const event = {
      kind: NOSTR_KINDS.SET_METADATA,
      content: JSON.stringify(profileContent),
      tags: []
    };
    
    console.log("Publishing profile update event:", event);
    
    // Publish to Nostr
    const eventId = await publishToNostr(event);
    
    if (eventId) {
      // Update local user profile data
      updateUserProfile({
        display_name: displayName,
        about: bio,
        pubkey: currentUser.pubkey
      });
      
      return eventId;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to update profile:", error);
    toast({
      title: "Update failed",
      description: error instanceof Error ? error.message : "Failed to update profile",
      variant: "destructive"
    });
    return null;
  }
}

function pubkeyToNpub(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey);
  } catch (error) {
    console.error("Error converting pubkey to npub:", error);
    return `npub1${pubkey.substring(0, 20)}`;
  }
}
