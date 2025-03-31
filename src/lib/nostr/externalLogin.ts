/**
 * Utility for detecting Nostr extension state changes outside our app
 * This captures when a user logs in through the extension directly
 */

import { loginWithNostr } from "@/lib/nostr";

// Keep track of when we've checked the extension
let lastExtensionCheck = 0;
const CHECK_INTERVAL = 2000; // 2 seconds

/**
 * Check if the user has logged in through the Nostr extension outside our app
 * This is used to automatically update the UI when a user logs in through the extension
 * @param onLogin Function to call when login is detected
 * @returns A cleanup function to stop checking
 */
export function setupExternalLoginDetection(onLogin: () => void): () => void {
  let isRunning = true;
  
  const checkExtension = async () => {
    if (!isRunning) return;
    
    const now = Date.now();
    // Only check if we haven't checked recently
    if (now - lastExtensionCheck > CHECK_INTERVAL) {
      lastExtensionCheck = now;
      
      // We only want to check if the extension is available, not trigger a login prompt
      if (typeof window.nostr !== 'undefined') {
        try {
          // We use a trick to detect if the user is logged in without triggering the prompt
          // Most Nostr extensions have a property or internal state we can check
          
          // First try using window.nostr.isEnabled if available (some extensions have this)
          const isEnabled = typeof window.nostr.isEnabled === 'function' 
            ? await window.nostr.isEnabled() 
            : undefined;
            
          if (isEnabled) {
            // User is logged in through the extension, try to get their public key
            // But use a flag to avoid showing the popup
            const user = await loginWithNostr(false);
            if (user) {
              console.log("Detected Nostr extension login outside app");
              onLogin();
              isRunning = false; // Stop checking once logged in
              return;
            }
          }
        } catch (error) {
          // Ignore errors, they're expected if the user isn't logged in
        }
      }
    }
    
    // Continue checking if we're still running
    if (isRunning) {
      setTimeout(checkExtension, CHECK_INTERVAL);
    }
  };
  
  // Start checking
  checkExtension();
  
  // Return cleanup function
  return () => {
    isRunning = false;
  };
}