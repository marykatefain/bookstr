
import { Book } from "@/lib/nostr/types";
import { BASE_URL } from './types';
import { getCoverUrl, fetchISBNFromEditionKey, extractAuthorName } from './utils';
import { searchBooks } from './search';

/**
 * Search books by genre/subject using the search API with rating sort
 */
export async function searchBooksByGenre(genre: string, limit: number = 20): Promise<Book[]> {
  if (!genre || genre.trim() === '') {
    return [];
  }
  
  try {
    console.log(`Searching OpenLibrary for genre: "${genre}" with limit ${limit}`);
    
    // Convert genre to lowercase for consistency
    const formattedGenre = genre.toLowerCase();
    
    // Use the search API with subject, ISBN filter, and rating sort
    const response = await fetch(
      `${BASE_URL}/search.json?` + 
      `q=subject:"${encodeURIComponent(formattedGenre)}"&` +
      `sort=rating&` +
      `limit=${limit}`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`OpenLibrary genre search returned ${data.docs?.length || 0} results for "${genre}"`);
    
    // Map the results to our Book format
    const books = await Promise.all(
      data.docs
        // Only include books with an ISBN or cover
        .filter(doc => doc.isbn || doc.cover_i || doc.cover_edition_key)
        .map(async (doc) => {
          let isbn = "";
          
          // Try to get ISBN from various possible sources
          if (doc.isbn && doc.isbn.length > 0) {
            isbn = doc.isbn[0];
          } else if (doc.cover_edition_key) {
            console.log(`Fetching ISBN for genre book: ${doc.title} using edition key: ${doc.cover_edition_key}`);
            isbn = await fetchISBNFromEditionKey(doc.cover_edition_key);
            if (isbn) {
              console.log(`Found ISBN for genre book ${doc.title}: ${isbn}`);
            }
          }
          
          // Use our helper to get author name
          const authorName = extractAuthorName(doc);
          
          return {
            id: doc.key,
            title: doc.title,
            author: authorName,
            isbn: isbn,
            coverUrl: getCoverUrl(isbn, doc.cover_i),
            description: doc.description || "",
            pubDate: doc.first_publish_year?.toString() || "",
            pageCount: doc.number_of_pages_median || 0,
            categories: doc.subject?.slice(0, 3) || [genre]
          };
        })
    );
    
    console.log(`Processed ${books.length} books from genre search results`);
    return books;
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    // If genre search fails, try regular search as fallback
    console.log(`Falling back to regular search for: "${genre}"`);
    return searchBooks(genre, limit);
  }
}
