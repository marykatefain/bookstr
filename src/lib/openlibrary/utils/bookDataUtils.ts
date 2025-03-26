
/**
 * Utilities for transforming OpenLibrary data to Book objects
 */
import { getCoverUrl } from './coverUtils';

/**
 * Convert an OpenLibrary doc to a Book object
 */
export function docToBook(doc: any) {
  if (!doc) {
    console.error("Received null or undefined doc in docToBook");
    return {
      id: `ol_${Math.random().toString(36).substring(2, 10)}`,
      title: "Unknown Title",
      author: "Unknown Author",
      isbn: "",
      coverUrl: "",
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
  }

  // Get the best available cover URL
  const coverUrl = doc.cover_i 
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` 
    : (doc.cover_edition_key 
      ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`
      : "");
  
  // Extract the first available ISBN - try to get all possible ISBN sources
  let isbn = "";
  
  // Check many possible sources for ISBN
  if (doc.isbn_13 && Array.isArray(doc.isbn_13) && doc.isbn_13.length > 0) {
    isbn = doc.isbn_13[0];
  } else if (doc.isbn && Array.isArray(doc.isbn) && doc.isbn.length > 0) {
    isbn = doc.isbn[0];
  } else if (doc.availability && doc.availability.isbn) {
    isbn = doc.availability.isbn;
  }
  
  // Make sure we have valid title and author data
  let title = "Unknown Title";
  if (doc.title && typeof doc.title === 'string' && doc.title.trim() !== '') {
    title = doc.title.trim();
  }
  
  // Get author name from various possible sources
  let author = "Unknown Author";
  if (doc.author_name && Array.isArray(doc.author_name) && doc.author_name.length > 0) {
    author = doc.author_name[0];
  } else if (doc.authors && Array.isArray(doc.authors) && doc.authors.length > 0) {
    if (doc.authors[0].name && typeof doc.authors[0].name === 'string') {
      author = doc.authors[0].name;
    }
  }
  
  console.log(`docToBook processing: ISBN=${isbn}, title="${title}", author="${author}"`);
  
  return {
    id: doc.key || `ol_${Math.random().toString(36).substring(2, 10)}`,
    title: title,
    author: author,
    isbn: isbn,
    coverUrl: coverUrl,
    description: doc.description?.value || doc.description || "",
    pubDate: doc.first_publish_year?.toString() || (doc.publish_date && Array.isArray(doc.publish_date) ? doc.publish_date[0] : ""),
    pageCount: doc.number_of_pages_median || 0,
    categories: doc.subject?.slice(0, 3) || [],
    author_name: doc.author_name || (doc.authors ? doc.authors.map((a: any) => a.name).filter(Boolean) : [])
  };
}
