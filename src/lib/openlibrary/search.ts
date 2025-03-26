import { Book } from "../nostr/types";
import { getBookDetails } from "./bookDetails";
import { throttlePromises } from "@/lib/utils";

// Cache search results for 1 hour (3600000 ms)
const SEARCH_CACHE_DURATION = 3600000;
const searchCache = new Map<string, { data: Book[], timestamp: number }>();

/**
 * Search for books by title or author
 * @param query The search query
 * @param limit The maximum number of results to return
 * @param quickMode If true, return basic book data without fetching full details
 * @returns Array of books matching the search
 */
export async function searchBooks(query: string, limit = 20, quickMode = false): Promise<Book[]> {
  if (!query) return [];
  
  console.log(`Searching OpenLibrary for: "${query}" with limit ${limit}, quickMode: ${quickMode}`);
  
  // Create cache key based on query and limit
  const cacheKey = `search:${query.toLowerCase()}:${limit}:${quickMode}`;
  
  // Check if we have a valid cached result
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.timestamp < SEARCH_CACHE_DURATION) {
    console.log(`Using cached search results for "${query}"`);
    return cached.data;
  }
  
  try {
    // Query OpenLibrary search API
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenLibrary search failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract basic book info for quick mode
    if (quickMode) {
      const books = processBasicSearchResults(data);
      searchCache.set(cacheKey, { data: books, timestamp: now });
      return books;
    }
    
    // Process results with full book details
    const books = await processSearchResults(data);
    
    // Cache the results
    searchCache.set(cacheKey, { data: books, timestamp: now });
    
    return books;
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

// Process search results with only basic information for immediate display
function processBasicSearchResults(searchData: any): Book[] {
  if (!searchData.docs || searchData.docs.length === 0) {
    return [];
  }
  
  return searchData.docs.map((doc: any) => {
    // Extract the first ISBN if available
    const isbn = doc.isbn ? (Array.isArray(doc.isbn) ? doc.isbn[0] : doc.isbn) : null;
    
    // Get the cover ID for the book
    const coverId = doc.cover_i || null;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` 
      : '';
    
    return {
      id: `ol:${doc.key}`,
      isbn: isbn,
      title: doc.title || 'Unknown Title',
      author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
      coverUrl,
      olKey: doc.key,
    };
  });
}

// For complete results with detailed book information
async function processSearchResults(searchData: any): Promise<Book[]> {
  if (!searchData.docs || searchData.docs.length === 0) {
    return [];
  }
  
  const booksWithBasicInfo = processBasicSearchResults(searchData);
  
  // Get full details for all books that have ISBNs
  const booksWithIsbns = booksWithBasicInfo.filter(book => book.isbn);
  
  if (booksWithIsbns.length === 0) {
    return booksWithBasicInfo;
  }
  
  // Get detailed information for each book with an ISBN, with throttling to avoid overloading the API
  const enhancedBooks = await throttlePromises(
    booksWithIsbns.map(book => () => getBookDetails(book.isbn!)),
    5 // Process 5 books at a time
  );
  
  // Create a map of ISBN to detailed book data
  const detailedBooksMap = new Map<string, Book>();
  enhancedBooks.forEach(book => {
    if (book && book.isbn) {
      detailedBooksMap.set(book.isbn, book);
    }
  });
  
  // Merge detailed data with basic data, preserving basic data for books without detailed info
  return booksWithBasicInfo.map(basicBook => {
    if (basicBook.isbn && detailedBooksMap.has(basicBook.isbn)) {
      const detailedBook = detailedBooksMap.get(basicBook.isbn)!;
      return {
        ...basicBook,
        ...detailedBook,
        // Ensure we keep the title and author from the search if they're better
        title: detailedBook.title || basicBook.title,
        author: detailedBook.author || basicBook.author,
        coverUrl: detailedBook.coverUrl || basicBook.coverUrl
      };
    }
    return basicBook;
  });
}

/**
 * Search for books by genre/subject
 * @param genre The genre to search for
 * @param limit The maximum number of results to return
 * @param quickMode If true, return basic book data without fetching full details
 * @returns Array of books in the requested genre
 */
export async function searchBooksByGenre(genre: string, limit = 20, quickMode = false): Promise<Book[]> {
  if (!genre) return [];
  
  console.log(`Searching OpenLibrary for genre: "${genre}" with limit ${limit}, quickMode: ${quickMode}`);
  
  // Create cache key based on genre and limit
  const cacheKey = `genre:${genre.toLowerCase()}:${limit}:${quickMode}`;
  
  // Check if we have a valid cached result
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.timestamp < SEARCH_CACHE_DURATION) {
    console.log(`Using cached genre results for "${genre}"`);
    return cached.data;
  }
  
  try {
    // Query OpenLibrary subject API
    const url = `https://openlibrary.org/subjects/${encodeURIComponent(genre.toLowerCase())}.json?limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenLibrary genre search failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract basic book info for quick mode
    if (quickMode) {
      const books = processBasicGenreResults(data);
      searchCache.set(cacheKey, { data: books, timestamp: now });
      return books;
    }
    
    // Process results with full book details
    const books = await processGenreResults(data);
    
    // Cache the results
    searchCache.set(cacheKey, { data: books, timestamp: now });
    
    return books;
  } catch (error) {
    console.error(`Error searching books by genre "${genre}":`, error);
    return [];
  }
}

// Process genre results with only basic information for immediate display
function processBasicGenreResults(genreData: any): Book[] {
  if (!genreData.works || genreData.works.length === 0) {
    return [];
  }
  
  return genreData.works.map((work: any) => {
    // Get the cover ID for the book
    const coverId = work.cover_id || null;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` 
      : '';
    
    return {
      id: `ol:${work.key}`,
      olKey: work.key,
      title: work.title || 'Unknown Title',
      author: work.authors?.[0]?.name || 'Unknown Author',
      coverUrl,
      categories: [genreData.name],
    };
  });
}

// For complete results with detailed book information
async function processGenreResults(genreData: any): Promise<Book[]> {
  if (!genreData.works || genreData.works.length === 0) {
    return [];
  }
  
  const booksWithBasicInfo = processBasicGenreResults(genreData);
  
  // For genre searches, we need to get the ISBNs first
  const booksWithEditionKeys = booksWithBasicInfo.filter(book => book.olKey);
  
  if (booksWithEditionKeys.length === 0) {
    return booksWithBasicInfo;
  }
  
  // Get the ISBNs for each book
  const booksWithISBNs = await Promise.all(
    booksWithEditionKeys.map(async (book) => {
      if (!book.olKey) return book;
      
      try {
        // Extract the work ID from the key
        const workId = book.olKey.replace('/works/', '');
        const url = `https://openlibrary.org/works/${workId}/editions.json?limit=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return book;
        }
        
        const data = await response.json();
        
        if (data.entries && data.entries.length > 0) {
          const edition = data.entries[0];
          const isbn = edition.isbn_13?.[0] || edition.isbn_10?.[0] || null;
          
          return {
            ...book,
            isbn,
            coverUrl: book.coverUrl || (edition.covers?.[0] 
              ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg` 
              : '')
          };
        }
        
        return book;
      } catch (error) {
        console.error(`Error getting ISBN for book ${book.olKey}:`, error);
        return book;
      }
    })
  );
  
  // Get detailed information for each book with an ISBN
  const booksWithValidISBNs = booksWithISBNs.filter(book => book.isbn);
  
  if (booksWithValidISBNs.length === 0) {
    return booksWithISBNs; // Return books with basic info and ISBNs if available
  }
  
  // Get detailed information for each book with an ISBN, with throttling
  const enhancedBooks = await throttlePromises(
    booksWithValidISBNs.map(book => () => getBookDetails(book.isbn!)),
    5 // Process 5 books at a time
  );
  
  // Create a map of ISBN to detailed book data
  const detailedBooksMap = new Map<string, Book>();
  enhancedBooks.forEach(book => {
    if (book && book.isbn) {
      detailedBooksMap.set(book.isbn, book);
    }
  });
  
  // Merge detailed data with basic data
  return booksWithISBNs.map(basicBook => {
    if (basicBook.isbn && detailedBooksMap.has(basicBook.isbn)) {
      const detailedBook = detailedBooksMap.get(basicBook.isbn)!;
      return {
        ...basicBook,
        ...detailedBook,
        // Ensure we keep the title and author from the search if they're better
        title: detailedBook.title || basicBook.title,
        author: detailedBook.author || basicBook.author,
        coverUrl: detailedBook.coverUrl || basicBook.coverUrl,
        // Keep the category from the genre search
        categories: [...(detailedBook.categories || []), ...(basicBook.categories || [])]
      };
    }
    return basicBook;
  });
}
