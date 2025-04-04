/**
 * Utilities for calculating hashes needed for Blossom upload auth
 */

/**
 * Calculate SHA-256 hash of a file
 * 
 * @param file The file to hash
 * @returns Promise resolving to the hex string of the SHA-256 hash
 */
export async function calculateSha256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target || !event.target.result) {
          throw new Error("Failed to read file");
        }
        
        // Get the file content as ArrayBuffer
        const arrayBuffer = event.target.result as ArrayBuffer;
        
        // Use the Web Crypto API to calculate the hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        
        // Convert the hash to a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        console.log(`SHA-256 hash for ${file.name} (${file.size} bytes): ${hashHex}`);
        resolve(hashHex);
      } catch (error) {
        console.error("Error calculating SHA-256 hash:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file for hashing"));
    };
    
    reader.readAsArrayBuffer(file);
  });
}