
/**
 * Utilities for handling author data and caching
 */

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for author details to reduce duplicate requests
const authorCache: Record<string, { name: string; timestamp: number }> = {};
const AUTHOR_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Fetch author details from an author key
 * Returns author name as a string, with fallback to "Unknown Author"
 */
export async function fetchAuthorDetails(authorKey: string): Promise<string> {
  if (!authorKey) {
    console.log("Empty author key provided");
    return "Unknown Author";
  }
  
  // Normalize the author key
  let normalizedKey = authorKey;
  
  // Make sure the key starts with a slash if it's not a full URL
  if (!normalizedKey.startsWith('/') && !normalizedKey.startsWith('http')) {
    normalizedKey = `/${normalizedKey}`;
  }
  
  // Return from cache if available
  const now = Date.now();
  const cachedAuthor = authorCache[normalizedKey];
  if (cachedAuthor && now - cachedAuthor.timestamp < AUTHOR_CACHE_TTL) {
    console.log(`Using cached author data for ${normalizedKey}: ${cachedAuthor.name}`);
    return cachedAuthor.name;
  }
  
  try {
    console.log(`Fetching author details for key: ${normalizedKey}`);
    
    // Ensure we're using the right format for the API call
    const response = await fetch(`${API_BASE_URL}${normalizedKey}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch author details for ${normalizedKey}: ${response.status}`);
      return "Unknown Author";
    }
    
    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid author data format for ${normalizedKey}`);
      return "Unknown Author";
    }
    
    // Extract author name from response
    const authorName = data.name || "Unknown Author";
    console.log(`Found author name: "${authorName}" for key ${normalizedKey}`);
    
    // Cache the result
    authorCache[normalizedKey] = { 
      name: authorName, 
      timestamp: now 
    };
    
    return authorName;
  } catch (error) {
    console.error(`Error fetching author details for ${normalizedKey}:`, error);
    return "Unknown Author";
  }
}
