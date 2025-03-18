
import { SimplePool, type Filter } from "nostr-tools";
import { BookReview, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { extractISBNFromTags, extractRatingFromTags } from "../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";

/**
 * Fetch reviews for a specific book
 */
export async function fetchBookReviews(isbn: string): Promise<BookReview[]> {
  if (!isbn) {
    console.error("Cannot fetch reviews: ISBN is missing");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      "#i": [`isbn:${isbn}`]
    };
    
    const events = await pool.querySync(relays, filter);
    const reviews: BookReview[] = [];
    
    for (const event of events) {
      const rating = extractRatingFromTags(event);
      
      reviews.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        rating,
        createdAt: event.created_at * 1000
      });
    }
    
    // Fetch author profiles for the reviews
    const authorPubkeys = [...new Set(reviews.map(review => review.pubkey))];
    if (authorPubkeys.length > 0) {
      const profileFilter: Filter = {
        kinds: [NOSTR_KINDS.SET_METADATA],
        authors: authorPubkeys
      };
      
      const profileEvents = await pool.querySync(relays, profileFilter);
      
      // Create a map of pubkey to profile data
      const profileMap = new Map<string, { name?: string; picture?: string; npub?: string }>();
      
      for (const profileEvent of profileEvents) {
        try {
          const profileData = JSON.parse(profileEvent.content);
          profileMap.set(profileEvent.pubkey, {
            name: profileData.name || profileData.display_name,
            picture: profileData.picture,
            npub: profileEvent.pubkey
          });
        } catch (e) {
          console.error("Error parsing profile data:", e);
        }
      }
      
      // Add author info to reviews
      reviews.forEach(review => {
        if (profileMap.has(review.pubkey)) {
          review.author = profileMap.get(review.pubkey);
        }
      });
    }
    
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book reviews:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch ratings for a specific book
 */
export async function fetchBookRatings(isbn: string): Promise<BookReview[]> {
  if (!isbn) {
    console.error("Cannot fetch ratings: ISBN is missing");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.BOOK_RATING],
      "#i": [`isbn:${isbn}`]
    };
    
    const events = await pool.querySync(relays, filter);
    const ratings: BookReview[] = [];
    
    for (const event of events) {
      const rating = extractRatingFromTags(event);
      
      if (rating) {
        ratings.push({
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          rating,
          createdAt: event.created_at * 1000
        });
      }
    }
    
    // Fetch author profiles for the ratings (similar to reviews)
    const authorPubkeys = [...new Set(ratings.map(rating => rating.pubkey))];
    if (authorPubkeys.length > 0) {
      const profileFilter: Filter = {
        kinds: [NOSTR_KINDS.SET_METADATA],
        authors: authorPubkeys
      };
      
      const profileEvents = await pool.querySync(relays, profileFilter);
      
      // Create a map of pubkey to profile data
      const profileMap = new Map<string, { name?: string; picture?: string; npub?: string }>();
      
      for (const profileEvent of profileEvents) {
        try {
          const profileData = JSON.parse(profileEvent.content);
          profileMap.set(profileEvent.pubkey, {
            name: profileData.name || profileData.display_name,
            picture: profileData.picture,
            npub: profileEvent.pubkey
          });
        } catch (e) {
          console.error("Error parsing profile data:", e);
        }
      }
      
      // Add author info to ratings
      ratings.forEach(rating => {
        if (profileMap.has(rating.pubkey)) {
          rating.author = profileMap.get(rating.pubkey);
        }
      });
    }
    
    return ratings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book ratings:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch reviews written by a user
 */
export async function fetchUserReviews(pubkey: string): Promise<BookReview[]> {
  if (!pubkey) {
    console.error("Cannot fetch reviews: pubkey is missing");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    const reviews: BookReview[] = [];
    
    for (const event of events) {
      const rating = extractRatingFromTags(event);
      const isbn = extractISBNFromTags(event);
      
      reviews.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        rating,
        bookIsbn: isbn,
        createdAt: event.created_at * 1000
      });
    }
    
    // Fetch books for the reviews
    const isbns = reviews
      .map(review => review.bookIsbn)
      .filter((isbn): isbn is string => isbn !== null);
    
    if (isbns.length > 0) {
      const books = await getBooksByISBN([...new Set(isbns)]);
      
      // Add book titles to reviews
      reviews.forEach(review => {
        if (review.bookIsbn) {
          const book = books.find(b => b.isbn === review.bookIsbn);
          if (book) {
            review.bookTitle = book.title;
            review.bookCover = book.coverUrl;
          }
        }
      });
    }
    
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  } finally {
    pool.close(relays);
  }
}
