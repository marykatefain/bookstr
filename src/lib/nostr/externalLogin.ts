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
          // Try to detect if user is logged in without triggering a prompt
          // Use getPublicKey which most extensions support
          // We'll catch the error if they're not logged in
          const publicKey = await window.nostr.getPublicKey().catch(() => null);
          
          if (publicKey) {
            // User is logged in through the extension
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
