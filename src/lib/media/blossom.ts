/**
 * Blossom API client for media uploads.
 * https://blossom.band is a service that allows uploading media to Nostr relays.
 * Implementation based on BUDs specifications: https://github.com/hzrd149/blossom/blob/master/buds/
 */
import { isLoggedIn, getCurrentUser } from '../nostr/user';

/**
 * Configuration for the Blossom API client.
 */
export const BLOSSOM_API_URL = 'https://blossom.band';
export const BLOSSOM_UPLOAD_ENDPOINT = '/upload';
export const BLOSSOM_MIRROR_ENDPOINT = '/mirror';

/**
 * Interface for upload response from Blossom (Blob Descriptor)
 * As per BUD-02: https://github.com/hzrd149/blossom/blob/master/buds/02.md#blob-descriptor
 */
export interface BlossomUploadResponse {
  url: string;       // URL to the blob
  sha256: string;    // SHA-256 hash of the blob
  size: number;      // Size in bytes
  type?: string;     // MIME type
  uploaded?: number; // Unix timestamp
  alt?: string;      // Optional alt text (not in spec but useful)
  dim?: string;      // Optional dimensions (not in spec but useful)
  nip94?: string[][]; // Optional NIP-94 file metadata tags
}

/**
 * Options for uploading a file to Blossom
 */
export interface BlossomUploadOptions {
  file: File;
  altText?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Create Blossom authorization token using Nostr event
 * As per BUD-01: https://github.com/hzrd149/blossom/blob/master/buds/01.md#authorization-events
 * 
 * @param file The file being uploaded (needed to calculate hash)
 * @param operation The operation type: 'upload', 'get', 'list', or 'delete'
 * @returns Promise with base64 encoded signed event
 */
async function createBlossomAuthToken(file: File, operation: 'upload' | 'get' | 'list' | 'delete' = 'upload'): Promise<string | null> {
  try {
    if (!isLoggedIn()) {
      console.error("User not logged in when trying to create Blossom auth token");
      return null;
    }
    
    // Import the hash calculation utility
    const { calculateSha256 } = await import('./hash-utils');
    
    // Calculate SHA-256 hash of the file content
    console.log(`Calculating SHA-256 hash of file "${file.name}" (${file.size} bytes)...`);
    const fileHash = await calculateSha256(file);
    console.log("File hash calculated:", fileHash);
    
    // Set expiration to 10 minutes from now (600 seconds)
    const expiration = Math.floor(Date.now() / 1000) + 600;

    // Get current time (as required for 'created_at' field in Nostr events)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create a Nostr event with the required parameters for Blossom auth
    // Kind 24242 is for HTTP Auth, and we're following the exact format from the example
    const authEvent = {
      kind: 24242, 
      tags: [
        ["t", operation],          // Operation type tag 
        ["x", fileHash],           // File hash tag - critical for auth
        ["expiration", expiration.toString()] // When this auth expires
      ], 
      content: `Upload ${file.name}`, // Human-readable explanation
      created_at: timestamp
    };

    try {
      // Use window.nostr to sign the event
      if (!window.nostr) {
        throw new Error("Nostr extension not available");
      }
      
      const user = getCurrentUser();
      if (!user || !user.pubkey) {
        throw new Error("User not logged in or pubkey not available");
      }
      
      const unsignedEvent = {
        ...authEvent,
        pubkey: user.pubkey,
      };
      
      console.log("Creating Blossom auth with unsigned event:", unsignedEvent);
      
      // Get the full signed event
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      
      if (!signedEvent) {
        throw new Error("Failed to sign event for Blossom auth");
      }
      
      console.log("Successfully signed Blossom auth event:", signedEvent);
      
      // BASE64 ENCODE the serialized event - this is critical
      const serializedEvent = JSON.stringify(signedEvent);
      const base64EncodedEvent = btoa(serializedEvent);
      console.log(`Base64 encoded auth token (first 50 chars): ${base64EncodedEvent.substring(0, 50)}...`);
      
      // Return the BASE64 ENCODED event, NOT the JSON string
      return base64EncodedEvent;
    } catch (signError) {
      console.error("Error signing Blossom auth event:", signError);
      return null;
    }
  } catch (error) {
    console.error("Error creating Blossom authorization token:", error);
    return null;
  }
}

/**
 * Check if a file can be uploaded to Blossom before actual upload
 * As per BUD-06: https://github.com/hzrd149/blossom/blob/master/buds/06.md
 * 
 * @param file The file to check
 * @param authToken The base64-encoded authorization token
 * @returns Promise resolving to true if upload is allowed, or error message if not
 */
async function checkUploadRequirements(file: File, authToken: string): Promise<true | string> {
  try {
    const { calculateSha256 } = await import('./hash-utils');
    const fileHash = await calculateSha256(file);
    
    // Use fetch for the HEAD request
    const response = await fetch(`${BLOSSOM_API_URL}${BLOSSOM_UPLOAD_ENDPOINT}`, {
      method: 'HEAD',
      headers: {
        'X-SHA-256': fileHash,
        'X-Content-Length': file.size.toString(),
        'X-Content-Type': file.type,
        'Authorization': `Nostr ${authToken}`
      }
    });
    
    if (response.ok) {
      return true;
    } else {
      // Try to get the X-Reason header for more details
      const reason = response.headers.get('X-Reason');
      if (reason) {
        return `Upload not allowed: ${reason}`;
      }
      return `Upload not allowed (status ${response.status})`;
    }
  } catch (error) {
    console.error('Error checking upload requirements:', error);
    return 'Failed to check upload requirements';
  }
}

/**
 * Uploads a file to the Blossom service following BUD specs.
 * 
 * @param options The options for the upload
 * @returns Promise with the upload response containing the URL and metadata
 */
export async function uploadMediaToBlossom(
  options: BlossomUploadOptions
): Promise<BlossomUploadResponse> {
  try {
    const { file, altText, onProgress } = options;

    // Log attempt information for debugging
    console.log("Attempting to upload to Blossom:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${Math.round(file.size / 1024)} KB`,
      hasAltText: !!altText
    });
    
    // 1. Create Blossom auth token (base64-encoded Nostr event) with file hash
    console.log("Creating Blossom auth token with file hash...");
    const authToken = await createBlossomAuthToken(file, 'upload');
    
    if (!authToken) {
      console.error("Failed to create Blossom authorization token");
      throw new Error("Failed to create Blossom authorization token");
    }
    
    console.log("Successfully created Blossom auth token");

    // 2. Check upload requirements first (BUD-06)
    console.log("Checking upload requirements...");
    const requirementsCheck = await checkUploadRequirements(file, authToken);
    if (requirementsCheck !== true) {
      throw new Error(requirementsCheck);
    }
    console.log("Upload requirements check passed");

    // 3. Perform the actual upload using XMLHttpRequest for progress tracking
    // Create a promise to handle the upload with progress
    const uploadPromise = new Promise<BlossomUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const uploadURL = `${BLOSSOM_API_URL}${BLOSSOM_UPLOAD_ENDPOINT}`;
      
      // IMPORTANT: BUD-02 specifies PUT method, not POST
      xhr.open('PUT', uploadURL, true);
      
      // Set the authorization header with the base64-encoded Nostr event
      xhr.setRequestHeader('Authorization', `Nostr ${authToken}`);
      
      // Add Content-Type if known (optional but helpful)
      if (file.type) {
        xhr.setRequestHeader('Content-Type', file.type);
      }
      
      // Add Content-Length (optional but helpful)
      xhr.setRequestHeader('Content-Length', file.size.toString());
      
      // Add progress event handler if provided
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
            if (progress % 25 === 0) { // Log at 0, 25, 50, 75, 100%
              console.log(`Upload progress: ${progress}%`);
            }
          }
        });
      }
      
      xhr.onload = () => {
        console.log(`Blossom response status: ${xhr.status}`);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseText = xhr.responseText;
            console.log("Blossom response:", responseText);
            
            const response = JSON.parse(responseText);
            
            // Ensure we have the required fields from the Blob Descriptor (BUD-02)
            if (!response.url || !response.sha256 || !response.size) {
              console.error("Invalid Blob Descriptor in response", response);
              reject(new Error("Invalid response from Blossom: missing required fields in Blob Descriptor"));
              return;
            }
            
            // Construct the result from the Blob Descriptor
            const result: BlossomUploadResponse = {
              url: response.url,
              sha256: response.sha256,
              size: response.size,
              type: response.type,
              uploaded: response.uploaded,
              // Add additional metadata if available
              alt: altText, // Include the provided alt text
              dim: response.dim, // Some servers might include dimensions
              nip94: response.nip94 // Some servers return NIP-94 tags (BUD-08)
            };
            
            console.log("Processed Blossom response:", result);
            resolve(result);
          } catch (error) {
            console.error("Error parsing Blossom response:", error, xhr.responseText);
            reject(new Error('Invalid response from Blossom server'));
          }
        } else {
          // Log more details about the error
          const xReason = xhr.getResponseHeader('X-Reason');
          console.error(`Upload failed with status: ${xhr.status}`, {
            statusText: xhr.statusText,
            xReason: xReason,
            responseText: xhr.responseText || "No response body",
            headers: xhr.getAllResponseHeaders()
          });
          
          // Use X-Reason if available for better error message
          const errorMessage = xReason 
            ? `Upload failed: ${xReason}` 
            : xhr.statusText 
              ? `Upload failed: ${xhr.status} ${xhr.statusText}` 
              : `Upload failed with status: ${xhr.status}`;
              
          reject(new Error(errorMessage));
        }
      };
      
      xhr.onerror = () => {
        console.error("Network error during Blossom upload:", {
          readyState: xhr.readyState,
          status: xhr.status,
          statusText: xhr.statusText || "No status text"
        });
        reject(new Error('Network error occurred during upload'));
      };
      
      // IMPORTANT: For PUT /upload, send the file directly as the body, not in FormData
      // This is specified in BUD-02
      xhr.send(file);
    });

    return await uploadPromise;
  } catch (error) {
    console.error('Error uploading to Blossom:', error);
    throw error;
  }
}

/**
 * Mirror a blob from another URL to Blossom
 * As per BUD-04: https://github.com/hzrd149/blossom/blob/master/buds/04.md
 * 
 * @param sourceUrl The URL of the blob to mirror
 * @param authToken The authorization token (same as for upload)
 * @returns Promise with the upload response containing the URL and metadata
 */
export async function mirrorMediaToBlossom(
  sourceUrl: string,
  authToken: string
): Promise<BlossomUploadResponse> {
  try {
    console.log(`Attempting to mirror media from ${sourceUrl} to Blossom`);
    
    // Create the request
    const response = await fetch(`${BLOSSOM_API_URL}${BLOSSOM_MIRROR_ENDPOINT}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Nostr ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: sourceUrl })
    });
    
    if (!response.ok) {
      const xReason = response.headers.get('X-Reason');
      throw new Error(xReason || `Mirror failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Mirror response:", data);
    
    // Return the Blob Descriptor
    return {
      url: data.url,
      sha256: data.sha256,
      size: data.size,
      type: data.type,
      uploaded: data.uploaded
    };
  } catch (error) {
    console.error('Error mirroring to Blossom:', error);
    throw error;
  }
}

/**
 * Get user's preferred Blossom servers
 * This would typically fetch the kind:10063 event as per BUD-03
 * For now, we're just returning blossom.band as the default
 * 
 * @returns Array of server URLs
 */
export async function getBlossomServerList(): Promise<string[]> {
  // In a real implementation, we would fetch the user's kind:10063 event
  // For now, just return the default server
  return [BLOSSOM_API_URL];
}