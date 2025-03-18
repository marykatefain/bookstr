import { Book } from "@/lib/nostr/types";

const BASE_URL = "https://openlibrary.org";

interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  publish_date?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  first_publish_year?: number;
  description?: string;
}

/**
 * Search books on OpenLibrary
 */
export async function searchBooks(query: string, limit: number = 20): Promise<Book[]> {
  try {
    const response = await fetch(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    return data.docs
      .filter(doc => doc.isbn && doc.isbn.length > 0) // Ensure we have ISBN
      .map(docToBook);
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return [];
  }
}

/**
 * Search books by genre/subject
 */
export async function searchBooksByGenre(genre: string, limit: number = 20): Promise<Book[]> {
  try {
    // Convert genre to lowercase and handle spaces for URL
    const formattedGenre = genre.toLowerCase().replace(/\s+/g, '_');
    
    // Use the subjects API to get books in a specific genre
    const response = await fetch(`${BASE_URL}/subjects/${formattedGenre}.json?limit=${limit}`);
    
    if (!response.ok) {
      // If genre not found, fall back to search
      return searchBooks(genre, limit);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    return works
      .filter((work: any) => work.cover_id)
      .map((work: any) => {
        // Create a Book object from the work data
        const isbn = work.availability?.isbn || "";
        return {
          id: work.key,
          title: work.title,
          author: work.authors?.[0]?.name || "Unknown Author",
          isbn: isbn,
          coverUrl: getCoverUrl(isbn, work.cover_id),
          description: work.description?.value || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: [data.name || genre]
        };
      });
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    return searchBooks(genre, limit); // Fallback to regular search
  }
}

/**
 * Get trending or popular books
 */
export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  try {
    // Using subjects that typically have popular books
    const response = await fetch(`${BASE_URL}/subjects/fiction.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.works || [];
    
    return works
      .filter((work: any) => work.cover_id)
      .map((work: any) => {
        const isbn = work.availability?.isbn || "";
        return {
          id: work.key,
          title: work.title,
          author: work.authors?.[0]?.name || "Unknown Author",
          isbn: isbn,
          coverUrl: getCoverUrl(isbn, work.cover_id),
          description: work.description?.value || "",
          pubDate: work.first_publish_year?.toString() || "",
          pageCount: 0,
          categories: [data.name || "Fiction"]
        };
      });
  } catch (error) {
    console.error("Error fetching trending books:", error);
    return [];
  }
}

/**
 * Get recently added books
 */
export async function getRecentBooks(limit: number = 10): Promise<Book[]> {
  try {
    // Newly added books to OpenLibrary
    const response = await fetch(`${BASE_URL}/recent.json?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const entries = data.recent || [];
    const bookPromises = entries
      .filter((entry: any) => entry.type === 'work' && entry.work)
      .slice(0, limit)
      .map(async (entry: any) => {
        try {
          const workResponse = await fetch(`${BASE_URL}${entry.work}.json`);
          const work = await workResponse.json();
          const coverId = work.covers?.[0];
          return {
            id: work.key,
            title: work.title,
            author: work.authors?.[0]?.author?.key ? await getAuthorName(work.authors[0].author.key) : "Unknown Author",
            isbn: "", // Often not available for new entries
            coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg",
            description: typeof work.description === 'string' ? work.description : work.description?.value || "",
            pubDate: work.first_publish_date || "",
            pageCount: 0,
            categories: work.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || ["Fiction"]
          };
        } catch (err) {
          console.error("Error fetching work details:", err);
          return null;
        }
      });
      
    const books = await Promise.all(bookPromises);
    return books.filter((book): book is Book => book !== null);
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

/**
 * Get details for a specific book by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  try {
    const response = await fetch(`${BASE_URL}/isbn/${isbn}.json`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const workKey = data.works?.[0]?.key;
    
    if (workKey) {
      const workResponse = await fetch(`${BASE_URL}${workKey}.json`);
      const work = await workResponse.json();
      
      return {
        id: work.key,
        title: data.title,
        author: data.authors?.[0]?.name || "Unknown Author",
        isbn: isbn,
        coverUrl: getCoverUrl(isbn, data.covers?.[0]),
        description: typeof work.description === 'string' ? work.description : work.description?.value || "",
        pubDate: data.publish_date || work.first_publish_date || "",
        pageCount: data.number_of_pages || 0,
        categories: work.subjects?.slice(0, 3).map((s: string) => s.replace(/^./, (c: string) => c.toUpperCase())) || []
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    return null;
  }
}

/**
 * Get multiple books by their ISBNs
 */
export async function getBooksByISBN(isbns: string[]): Promise<Book[]> {
  const bookPromises = isbns.map(isbn => getBookByISBN(isbn));
  const books = await Promise.all(bookPromises);
  return books.filter((book): book is Book => book !== null);
}

/**
 * Helper to convert an OpenLibrary doc to our Book type
 */
function docToBook(doc: OpenLibraryDoc): Book {
  const isbn = doc.isbn?.[0] || "";
  return {
    id: doc.key || `ol-${isbn}`,
    title: doc.title,
    author: doc.author_name?.[0] || "Unknown Author",
    isbn: isbn,
    coverUrl: getCoverUrl(isbn, doc.cover_i),
    description: doc.description || "",
    pubDate: doc.first_publish_year?.toString() || doc.publish_date?.[0] || "",
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3).map(s => s.replace(/^./, c => c.toUpperCase())) || []
  };
}

/**
 * Get the cover URL for a book
 */
function getCoverUrl(isbn: string, coverId?: number): string {
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return "https://covers.openlibrary.org/b/isbn/placeholder-L.jpg";
}

/**
 * Get the name of an author from their key
 */
async function getAuthorName(authorKey: string): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}${authorKey}.json`);
    if (!response.ok) {
      return "Unknown Author";
    }
    const author = await response.json();
    return author.name || "Unknown Author";
  } catch (error) {
    console.error("Error fetching author:", error);
    return "Unknown Author";
  }
}
