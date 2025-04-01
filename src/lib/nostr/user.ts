
import { toast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { NostrProfile } from "./types";
import { NostrEventData } from "./types/common";
import { loadRelaysFromStorage, getUserRelays } from "./relay";
import { fetchProfileData, clearProfileCache } from "./profile";
import { NOSTR_KINDS } from "./types/constants";
import { updateNostrProfile } from "./profilePublisher";

const NOSTR_USER_KEY = 'bookverse_nostr_user';
let currentUser: NostrProfile | null = null;

// For detecting Nostr extension changes
let nostrExtensionCheckInterval: number | null = null;
let lastNostrState: { hasExtension: boolean, isLoggedIn: boolean } = { 
  hasExtension: false, 
  isLoggedIn: false 
};

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
      
      // Start watching for Nostr extension changes
      startNostrExtensionWatcher();
      
      return currentUser;
    }
    
    // Even if no saved user, start watching for Nostr extension changes
    startNostrExtensionWatcher();
    return null;
  } catch (error) {
    console.error("Failed to initialize Nostr:", error);
    // Still attempt to watch extension changes even on error
    startNostrExtensionWatcher();
    return null;
  }
}

// Watch for changes in the Nostr extension state
function startNostrExtensionWatcher() {
  // Don't start multiple intervals
  if (nostrExtensionCheckInterval !== null) return;
  
  // Check immediately once
  checkNostrExtensionState();
  
  // Then check periodically
  nostrExtensionCheckInterval = window.setInterval(checkNostrExtensionState, 2000);
  
  console.log("Started watching for Nostr extension changes");
}

// Stop watching for extension changes
function stopNostrExtensionWatcher() {
  if (nostrExtensionCheckInterval !== null) {
    window.clearInterval(nostrExtensionCheckInterval);
    nostrExtensionCheckInterval = null;
    console.log("Stopped watching for Nostr extension changes");
  }
}

// Check the current state of the Nostr extension
async function checkNostrExtensionState() {
  const hasExtension = typeof window.nostr !== 'undefined';
  const hasSavedUser = getCurrentUser() !== null;
  
  // Extension disappeared - nothing to do
  if (!hasExtension) {
    if (lastNostrState.hasExtension) {
      console.log("Nostr extension no longer detected");
      lastNostrState = { hasExtension: false, isLoggedIn: false };
    }
    return;
  }
  
  // Extension appeared - update state
  if (!lastNostrState.hasExtension) {
    console.log("Nostr extension detected");
    lastNostrState.hasExtension = true;
  }
  
  // If we're already logged in, no need to check further
  if (hasSavedUser) {
    if (!lastNostrState.isLoggedIn) {
      lastNostrState.isLoggedIn = true;
      stopNostrExtensionWatcher(); // No need to keep checking once logged in
    }
    return;
  }
  
  // For users who aren't logged in, don't try to automatically get the public key
  // This prevents the unwanted popup until they explicitly click the login button
  if (!hasSavedUser) {
    return;
  }
}

export async function loginWithNostr(manualLogin = true) {
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

    // If this was a manual login (button click), they may log in through
    // the extension in the future, so make sure we're watching for that
    if (manualLogin) {
      lastNostrState.isLoggedIn = true;
      startNostrExtensionWatcher();
    }

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
  
  // Reset Nostr extension state tracking
  lastNostrState.isLoggedIn = false;
  // Start watching again in case the user logs back in through the extension
  startNostrExtensionWatcher();
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
export async function updateUserProfileEvent(
  nameOrEventData: string | Partial<NostrEventData>, 
  bio?: string, 
  website?: string, 
  nip05?: string,
  pictureUrl?: string
): Promise<string | null> {
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

    // Handle both function signatures - either a pre-formatted event or individual fields
    let event: Partial<NostrEventData>;

    if (typeof nameOrEventData === 'object') {
      // Called with event object directly
      event = nameOrEventData;
    } else {
      // Called with individual fields - legacy format
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
            picture: latestProfile.picture || currentUser.picture,
            about: latestProfile.about || currentUser.about,
            website: latestProfile.website,
            nip05: latestProfile.nip05
          };
        }
      } else if (currentUser) {
        // Use current user data as fallback
        profileContent = {
          name: currentUser.name,
          picture: currentUser.picture,
          about: currentUser.about,
          website: currentUser.website,
          nip05: currentUser.nip05
        };
      }
      
      // Update only the specific fields
      profileContent.name = nameOrEventData; // This is the name parameter
      if (bio !== undefined) {
        profileContent.about = bio;
      }
      
      // Only update picture if provided
      if (pictureUrl !== undefined) {
        profileContent.picture = pictureUrl;
      }
      
      // Only update website if provided
      if (website !== undefined) {
        profileContent.website = website;
      }
      
      // Only update nip05 if provided
      if (nip05 !== undefined) {
        profileContent.nip05 = nip05;
      }
      
      // Create the event
      event = {
        kind: NOSTR_KINDS.SET_METADATA,
        content: JSON.stringify(profileContent),
        tags: []
      };
    }
    
    console.log("Publishing profile update event:", event);
    
    // Publish to Nostr
    const eventId = await updateNostrProfile(event, currentUser);
    
    if (eventId) {
      // Clear the profile cache to force a fresh fetch
      clearProfileCache(currentUser.pubkey);
      
      // Fetch the latest profile data
      const updatedProfile = await fetchProfileData(currentUser.pubkey);
      
      // Update local user profile data with the freshly fetched data
      if (updatedProfile) {
        updateUserProfile({
          ...updatedProfile,
          pubkey: currentUser.pubkey
        });
      } else {
        // Fallback if fetch fails - update with the values we know
        // Check if we're using the event object format or individual params
        if (typeof nameOrEventData === 'object') {
          try {
            const content = JSON.parse(nameOrEventData.content || '{}');
            updateUserProfile({
              name: content.name,
              about: content.about,
              picture: content.picture,
              website: content.website,
              nip05: content.nip05,
              pubkey: currentUser.pubkey
            });
          } catch (e) {
            console.error("Failed to parse event content for local update:", e);
          }
        } else {
          // Using individual params
          updateUserProfile({
            name: nameOrEventData,
            about: bio,
            website: website,
            nip05: nip05,
            picture: pictureUrl,
            pubkey: currentUser.pubkey
          });
        }
      }
      
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

export function cleanupNostr() {
  if (nostrExtensionCheckInterval !== null) {
    window.clearInterval(nostrExtensionCheckInterval);
    nostrExtensionCheckInterval = null;
    console.log("Cleaned up Nostr extension watcher");
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
