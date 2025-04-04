/**
 * Multi-service media upload for Nostr.
 * Supports multiple upload services with fallback.
 */
import { 
  uploadMediaToBlossom, 
  BLOSSOM_API_URL, 
  BLOSSOM_UPLOAD_ENDPOINT,
  mirrorMediaToBlossom,
  getBlossomServerList
} from './blossom';

/**
 * Interface for upload response from media services
 */
export interface MediaUploadResponse {
  url: string;
  sha256?: string;
  size?: number;
  type?: string;
  alt?: string;
  dim?: string;
  service: string; // Name of the service that succeeded
}

/**
 * Options for uploading a file
 */
export interface MediaUploadOptions {
  file: File;
  altText?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Uploads a file to Blossom.
 * In a future implementation, this could support multiple services with fallbacks.
 * 
 * @param options The options for the upload
 * @returns Promise with the upload response containing the URL
 */
export async function uploadMedia(
  options: MediaUploadOptions
): Promise<MediaUploadResponse> {
  const { file, altText, onProgress } = options;

  // Log attempt information
  console.log("Attempting to upload media:", {
    fileName: file.name,
    fileType: file.type,
    fileSize: `${Math.round(file.size / 1024)} KB`,
    hasAltText: !!altText
  });

  try {
    console.log("Using Blossom for media upload");
    
    // Use our improved Blossom implementation
    const result = await uploadMediaToBlossom({
      file,
      altText,
      onProgress
    });
    
    console.log(`Blossom upload successful: ${result.url}`);
    
    // Return successful response with all available metadata
    return {
      url: result.url,
      sha256: result.sha256,
      size: result.size,
      type: result.type,
      alt: result.alt || altText,
      dim: result.dim,
      service: "Blossom"
    };
  } catch (error) {
    console.error(`Failed to upload with Blossom:`, error);
    throw error;
  }
}

/**
 * Mirrors a media file from an existing URL to Blossom
 * 
 * @param sourceUrl The source URL to mirror
 * @param sha256 The SHA-256 hash of the file (needed for authentication)
 * @returns Promise with the mirrored file response
 */
export async function mirrorMedia(
  sourceUrl: string,
  sha256: string
): Promise<MediaUploadResponse> {
  try {
    // For now, we only support Blossom
    // In the future, this could be expanded to support other services
    
    // Get the user's preferred servers
    const servers = await getBlossomServerList();
    
    // Just use the first server for now
    const server = servers[0] || BLOSSOM_API_URL;
    
    console.log(`Attempting to mirror ${sourceUrl} to ${server}`);
    
    // TODO: Create auth token for the specific file
    // For now, this is a placeholder
    // const authToken = await createBlossomAuthToken(...);
    
    // TODO: Implement actual mirroring
    throw new Error("Media mirroring not yet implemented");
    
  } catch (error) {
    console.error("Failed to mirror media:", error);
    throw error;
  }
}

// Export Blossom-specific functions for direct access
export * from './blossom';