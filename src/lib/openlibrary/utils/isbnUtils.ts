
/**
 * Utilities for handling ISBN lookups and caching
 */

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Cache for ISBN lookup by edition key
const isbnCache: Record<string, string> = {};

// Cache for ISBN lookup by title and author
const titleAuthorIsbnCache: Record<string, string> = {};

/**
 * Fetch ISBN from edition key
 */
export async function fetchISBNFromEditionKey(editionKey: string): Promise<string> {
  // Check cache first
  if (isbnCache[editionKey]) {
    return isbnCache[editionKey];
  }
  
  try {
    // Convert OL12345M to just 12345 if needed
    const key = editionKey.startsWith('OL') ? editionKey : `OL${editionKey}`;
    
    // FIX: Use the correct path structure for books endpoint
    const response = await fetch(`${API_BASE_URL}/books/${key}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'default'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch edition data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check all possible ISBN locations
    let isbn = '';
    
    // Try ISBN 13 first (preferred)
    if (data.isbn_13 && data.isbn_13.length > 0) {
      isbn = data.isbn_13[0];
    }
    // Then try ISBN 10
    else if (data.isbn_10 && data.isbn_10.length > 0) {
      isbn = data.isbn_10[0];
    }
    // Then check identifiers object
    else if (data.identifiers) {
      if (data.identifiers.isbn_13 && data.identifiers.isbn_13.length > 0) {
        isbn = data.identifiers.isbn_13[0];
      }
      else if (data.identifiers.isbn_10 && data.identifiers.isbn_10.length > 0) {
        isbn = data.identifiers.isbn_10[0];
      }
    }
    
    // Cache the result (even if empty)
    isbnCache[editionKey] = isbn;
    
    return isbn;
  } catch (error) {
    console.error(`Error fetching ISBN for edition key ${editionKey}:`, error);
    return '';
  }
}

/**
 * Fetch ISBN for a book by title and author
 */
export async function fetchISBNByTitleAuthor(title: string, author?: string): Promise<string> {
  if (!title) {
    return '';
  }
  
  // Generate a cache key from title and author
  const cacheKey = `${title.toLowerCase()}-${(author || '').toLowerCase()}`;
  
  // Check cache first
  if (titleAuthorIsbnCache[cacheKey]) {
    return titleAuthorIsbnCache[cacheKey];
  }
  
  try {
    // Create search query
    const searchTerms = author ? `${title} ${author}` : title;
    const encodedQuery = encodeURIComponent(searchTerms);
    
    // FIX: Ensure search.json is in the path
    const response = await fetch(
      `${API_BASE_URL}/search.json?q=${encodedQuery}&fields=key,title,author_name,editions,editions.key,editions.title,editions.ebook_access,editions.isbn`, 
      {
        headers: { 'Accept': 'application/json' },
        cache: 'default'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) {
      return '';
    }
    
    // Find the first document that looks like a good match
    let isbn = '';
    
    for (const doc of data.docs) {
      // Check for exact title match
      if (doc.title.toLowerCase() === title.toLowerCase()) {
        // If we have editions with ISBNs, use the first one
        if (doc.editions && Array.isArray(doc.editions)) {
          for (const edition of doc.editions) {
            if (edition.isbn && Array.isArray(edition.isbn) && edition.isbn.length > 0) {
              isbn = edition.isbn[0];
              break;
            }
          }
        }
        
        // If we found an ISBN, break out of the loop
        if (isbn) break;
      }
    }
    
    // If we didn't find an exact match, just use the first result with an ISBN
    if (!isbn && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.editions && Array.isArray(doc.editions)) {
          for (const edition of doc.editions) {
            if (edition.isbn && Array.isArray(edition.isbn) && edition.isbn.length > 0) {
              isbn = edition.isbn[0];
              break;
            }
          }
        }
        
        // If we found an ISBN, break out of the loop
        if (isbn) break;
      }
    }
    
    // Cache the result (even if empty)
    titleAuthorIsbnCache[cacheKey] = isbn;
    
    return isbn;
  } catch (error) {
    console.error(`Error fetching ISBN for title "${title}":`, error);
    return '';
  }
}
