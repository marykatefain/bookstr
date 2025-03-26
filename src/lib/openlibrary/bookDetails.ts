
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey, fetchAuthorDetails } from './utils';

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

// Improved in-memory cache for book details
const bookCache: Record<string, { data: Book | null; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60 * 24; // Extend cache to 24 hours for better performance

/**
 * Get details for a specific book by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    console.error("Invalid ISBN provided");
    return null;
  }

  console.log(`getBookByISBN called for ISBN: ${isbn}`);

  // Check cache first
  const now = Date.now();
  const cached = bookCache[isbn];
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`Using cached data for ISBN ${isbn}`);
    return cached.data;
  }

  try {
    console.log(`Fetching book details from OpenLibrary for ISBN: ${isbn}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Extend timeout to 15 seconds
    
    // Use the correct path structure for ISBN endpoint
    const response = await fetch(`${API_BASE_URL}/isbn/${isbn}.json`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      // Force cache for better performance
      cache: 'force-cache'
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} for ISBN ${isbn}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    // Parse the response as JSON and handle different response formats
    const data = await response.json();
    console.log(`Raw book data for ISBN ${isbn}:`, JSON.stringify(data));
    
    // Handle the case where we might get an unexpected format
    if (!data || typeof data !== 'object') {
      console.error(`Invalid data format received for ISBN ${isbn}`);
      throw new Error("Invalid data format");
    }
    
    // If data is an array or has a docs property, it might be a search result
    // Otherwise, treat it as a flat book metadata object
    const bookData = Array.isArray(data) 
      ? data[0] 
      : data.docs 
        ? data.docs[0] 
        : data;
    
    if (!bookData) {
      console.error(`No book data found in response for ISBN ${isbn}`);
      throw new Error("No book data in response");
    }
    
    // Extract work key from the book data - works for both formats
    const workKey = bookData.works?.[0]?.key || bookData.key;
    
    let workData = null;
    if (workKey) {
      try {
        console.log(`Fetching work data for ${workKey}`);
        const workTimeoutId = setTimeout(() => controller.abort(), 15000);
        // Use the correct path structure for works endpoint
        const workResponse = await fetch(`${API_BASE_URL}${workKey}.json`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
          cache: 'force-cache'
        });
        clearTimeout(workTimeoutId);
        
        if (workResponse.ok) {
          workData = await workResponse.json();
          console.log(`Got work data:`, workData);
        } else {
          console.error(`Work API error: ${workResponse.status} for ${workKey}`);
        }
      } catch (workError) {
        console.error("Error fetching work data:", workError);
        // Continue with partial data
      }
    }
    
    // Fetch author details if available
    let authorNames: string[] = [];
    let authorName = "Unknown Author";
    
    // Handle different author data formats
    if (bookData.authors && Array.isArray(bookData.authors) && bookData.authors.length > 0) {
      console.log(`Found authors array in book data:`, bookData.authors);
      const authorPromises = bookData.authors.map(async (author: any) => {
        if (author.key) {
          const authorDetail = await fetchAuthorDetails(author.key);
          return authorDetail;
        } else if (author.name) {
          return author.name;
        }
        return "Unknown Author";
      });
      
      authorNames = await Promise.all(authorPromises);
      authorName = authorNames[0] || "Unknown Author";
      console.log(`Resolved author names: ${authorNames.join(', ')}`);
    } else if (workData?.authors && Array.isArray(workData.authors)) {
      console.log(`Found authors array in work data:`, workData.authors);
      const authorPromises = workData.authors.map(async (author: any) => {
        if (author.author?.key) {
          const authorDetail = await fetchAuthorDetails(author.author.key);
          return authorDetail;
        } else if (author.name) {
          return author.name;
        }
        return "Unknown Author";
      });
      
      authorNames = await Promise.all(authorPromises);
      authorName = authorNames[0] || "Unknown Author";
      console.log(`Resolved author names from work data: ${authorNames.join(', ')}`);
    } else if (bookData.author_name && Array.isArray(bookData.author_name)) {
      // Handle author_name array format (sometimes used in search results)
      authorNames = bookData.author_name;
      authorName = authorNames[0] || "Unknown Author";
      console.log(`Using author_name array: ${authorNames.join(', ')}`);
    } else if (typeof bookData.author === 'string') {
      // Handle flat author string
      authorName = bookData.author;
      authorNames = [authorName];
      console.log(`Using flat author string: ${authorName}`);
    } else {
      console.log(`No author information found in data for ISBN ${isbn}, using default`);
    }
    
    // Extract or generate a book ID
    const bookId = workData?.key || bookData.key || `isbn:${isbn}`;
    
    // Get the title from the most specific source
    const bookTitle = bookData.title || workData?.title || "Unknown Title";
    console.log(`Extracted title: ${bookTitle}`);
    
    // Extract the cover ID or use the ISBN for cover URL generation
    const coverId = bookData.covers?.[0] || workData?.covers?.[0];
    
    // Create book object with available data
    const book: Book = {
      id: bookId,
      title: bookTitle,
      author: authorName,
      author_name: authorNames.length > 0 ? authorNames : undefined,
      isbn: isbn,
      coverUrl: getCoverUrl(isbn, coverId),
      description: typeof workData?.description === 'string' 
        ? workData.description 
        : workData?.description?.value || 
          (typeof bookData.description === 'string' 
            ? bookData.description 
            : bookData.description?.value || ""),
      pubDate: bookData.publish_date || workData?.first_publish_date || "",
      pageCount: bookData.number_of_pages || 0,
      categories: workData?.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
    };

    console.log(`Processed book data for ISBN ${isbn}:`, {
      title: book.title,
      author: book.author,
      description: book.description ? book.description.substring(0, 100) + '...' : 'No description'
    });

    // Cache the result
    bookCache[isbn] = { data: book, timestamp: now };
    
    return book;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    
    // Cache the error state for a shorter period to allow retries
    bookCache[isbn] = { data: null, timestamp: now - (CACHE_TTL - 5 * 60 * 1000) }; // Cache for 5 minutes on errors
    
    return null;
  }
}

/**
 * Get book details by edition key (used as fallback when no ISBN is available)
 */
export async function getBookByEditionKey(editionKey: string): Promise<Book | null> {
  if (!editionKey || editionKey.trim() === '') {
    console.error("Invalid edition key provided");
    return null;
  }

  try {
    // Use the correct path structure for books endpoint
    const response = await fetch(`${API_BASE_URL}/books/${editionKey}.json`, {
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to get ISBN from the edition data
    let isbn = data.isbn_13?.[0] || data.isbn_10?.[0] || "";
    
    // If no ISBN directly available, try to extract it using identifiers
    if (!isbn && data.identifiers) {
      if (data.identifiers.isbn_13) isbn = data.identifiers.isbn_13[0];
      else if (data.identifiers.isbn_10) isbn = data.identifiers.isbn_10[0];
    }
    
    // If we still don't have an ISBN, fetch it as a last resort
    if (!isbn && editionKey.startsWith('OL')) {
      isbn = await fetchISBNFromEditionKey(editionKey);
    }
    
    const workKey = data.works?.[0]?.key;
    let workData = null;
    
    if (workKey) {
      // Use the correct path structure for works endpoint
      const workResponse = await fetch(`${API_BASE_URL}${workKey}.json`, {
        headers: { 'Accept': 'application/json' },
        cache: 'force-cache'
      });
      
      if (workResponse.ok) {
        workData = await workResponse.json();
      }
    }
    
    // Create the book object
    const book: Book = {
      id: workData?.key || `edition:${editionKey}`,
      title: data.title || "Unknown Title",
      author: data.authors?.[0]?.name || "Unknown Author",
      isbn: isbn,
      coverUrl: getCoverUrl(isbn, data.covers?.[0]),
      description: typeof workData?.description === 'string' ? workData.description : workData?.description?.value || "",
      pubDate: data.publish_date || workData?.first_publish_date || "",
      pageCount: data.number_of_pages || 0,
      categories: workData?.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
    };
    
    // Cache the result if we have an ISBN
    if (isbn) {
      bookCache[isbn] = { data: book, timestamp: Date.now() };
    }
    
    return book;
  } catch (error) {
    console.error("Error fetching book by edition key:", error);
    return null;
  }
}

/**
 * Get multiple books by their ISBNs with improved concurrency and error handling
 */
export async function getBooksByISBN(isbns: string[]): Promise<Book[]> {
  // Filter out any invalid ISBNs
  const validIsbns = isbns.filter(isbn => isbn && isbn.trim() !== '');
  if (validIsbns.length === 0) {
    return [];
  }

  console.log(`getBooksByISBN called for ${validIsbns.length} ISBNs:`, validIsbns);

  // Check cache first for all books
  const now = Date.now();
  const cachedBooks: Book[] = [];
  const isbnsToFetch: string[] = [];
  
  validIsbns.forEach(isbn => {
    const cached = bookCache[isbn];
    if (cached && cached.data && (now - cached.timestamp < CACHE_TTL)) {
      console.log(`Using cached data for ISBN ${isbn}`);
      cachedBooks.push(cached.data);
    } else {
      isbnsToFetch.push(isbn);
    }
  });
  
  // If all books are cached, return them immediately
  if (isbnsToFetch.length === 0) {
    console.log(`All ${cachedBooks.length} books found in cache`);
    return cachedBooks;
  }
  
  console.log(`Fetching ${isbnsToFetch.length} books from API`);
  
  // Fetch missing books with concurrency limit
  const fetchBook = async (isbn: string): Promise<Book | null> => {
    try {
      const book = await getBookByISBN(isbn);
      if (book) {
        console.log(`Successfully fetched book for ISBN ${isbn}: ${book.title} by ${book.author}`);
      } else {
        console.log(`Failed to fetch book for ISBN ${isbn}`);
      }
      return book;
    } catch (error) {
      console.error(`Error fetching book ${isbn}:`, error);
      return null;
    }
  };
  
  // Fetch in batches of 5 to avoid overwhelming the API
  const batchSize = 5;
  const fetchedBooks: Book[] = [];
  
  for (let i = 0; i < isbnsToFetch.length; i += batchSize) {
    const batch = isbnsToFetch.slice(i, i + batchSize);
    console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(isbnsToFetch.length/batchSize)}: ${batch.join(', ')}`);
    const batchResults = await Promise.all(batch.map(fetchBook));
    const validResults = batchResults.filter((book): book is Book => book !== null);
    console.log(`Batch ${Math.floor(i/batchSize) + 1} results: ${validResults.length}/${batch.length} books`);
    fetchedBooks.push(...validResults);
  }
  
  const allBooks = [...cachedBooks, ...fetchedBooks];
  console.log(`Returning ${allBooks.length} books (${cachedBooks.length} from cache, ${fetchedBooks.length} from API)`);
  
  return allBooks;
}

