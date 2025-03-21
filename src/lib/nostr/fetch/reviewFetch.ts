
import { type Filter } from "nostr-tools";
import { BookReview, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getSharedPool } from "../utils/poolManager";

/**
 * Fetch book reviews from Nostr
 */
export async function fetchBookReviews(isbn: string): Promise<BookReview[]> {
  console.log(`Fetching reviews for ISBN: ${isbn}`);
  
  if (!isbn) {
    console.error("No ISBN provided to fetchBookReviews");
    return [];
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      '#i': [`isbn:${isbn}`]
    };
    
    console.log(`Querying relays for reviews: ${relays.join(', ')}`);
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} review events for ISBN: ${isbn}`);
    
    const reviews: BookReview[] = events.map(event => ({
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      createdAt: event.created_at * 1000, // Convert to milliseconds
      tags: event.tags
    }));
    
    return reviews;
  } catch (error) {
    console.error(`Error fetching reviews for ISBN ${isbn}:`, error);
    return [];
  }
}

/**
 * Fetch book ratings from Nostr
 */
export async function fetchBookRatings(isbn: string): Promise<any[]> {
  console.log(`Fetching ratings for ISBN: ${isbn}`);
  
  if (!isbn) {
    console.error("No ISBN provided to fetchBookRatings");
    return [];
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.BOOK_RATING],
      '#i': [`isbn:${isbn}`]
    };
    
    console.log(`Querying relays for ratings: ${relays.join(', ')}`);
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} rating events for ISBN: ${isbn}`);
    
    const ratings = events.map(event => {
      const ratingTag = event.tags.find(tag => tag[0] === 'rating');
      const rating = ratingTag ? parseFloat(ratingTag[1]) : null;
      
      return {
        id: event.id,
        pubkey: event.pubkey,
        rating: rating,
        createdAt: event.created_at * 1000 // Convert to milliseconds
      };
    });
    
    return ratings;
  } catch (error) {
    console.error(`Error fetching ratings for ISBN ${isbn}:`, error);
    return [];
  }
}

/**
 * Fetch a single book review from Nostr
 */
export async function fetchSingleBookReview(eventId: string): Promise<BookReview | null> {
  if (!eventId) {
    console.error("No event ID provided to fetchSingleBookReview");
    return null;
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    const filter: Filter = {
      ids: [eventId]
    };
    
    const events = await pool.querySync(relays, filter);
    
    if (events.length === 0) {
      console.log(`No review found with ID: ${eventId}`);
      return null;
    }
    
    const event = events[0];
    
    return {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      createdAt: event.created_at * 1000, // Convert to milliseconds
      tags: event.tags
    };
  } catch (error) {
    console.error(`Error fetching review with ID ${eventId}:`, error);
    return null;
  }
}

/**
 * Fetch user reviews
 */
export async function fetchUserReviews(pubkey: string): Promise<BookReview[]> {
  if (!pubkey) {
    console.error("No pubkey provided to fetchUserReviews");
    return [];
  }
  
  try {
    const relays = getUserRelays();
    const pool = getSharedPool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} review events for user: ${pubkey}`);
    
    const reviews: BookReview[] = events.map(event => ({
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      createdAt: event.created_at * 1000, // Convert to milliseconds
      tags: event.tags
    }));
    
    return reviews;
  } catch (error) {
    console.error(`Error fetching reviews for user ${pubkey}:`, error);
    return [];
  }
}
