import { type Filter } from "nostr-tools";
import { BookReview, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { extractISBNFromTags, extractRatingFromTags } from "../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { getSharedPool } from "../utils/poolManager";

/**
 * Fetch reviews for a specific book
 */
export async function fetchBookReviews(isbn: string): Promise<BookReview[]> {
  if (!isbn) {
    console.error("Cannot fetch reviews: ISBN is missing");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      "#d": [`isbn:${isbn}`],
      "#k": ["isbn"]
    };
    
    const events = await pool.querySync(relays, filter);
    const reviews: BookReview[] = [];
    
    for (const event of events) {
      // Extract rating from tags - if present, convert from 0-1 scale to 0-5 scale
      let rating = null;
      
      const ratingTag = event.tags.find(tag => tag[0] === 'rating');
      if (ratingTag && ratingTag[1]) {
        try {
          const normalizedRating = parseFloat(ratingTag[1]);
          // Convert from 0-1 scale to 1-5 scale
          rating = Math.round(normalizedRating * 5);
        } catch (e) {
          console.error("Error parsing rating:", e);
        }
      }
      
      // Check for content-warning tag
      const contentWarningTag = event.tags.find(tag => tag[0] === 'content-warning');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      const isSpoiler = !!contentWarningTag || (!!spoilerTag && spoilerTag[1] === "true");
      
      reviews.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        rating,
        createdAt: event.created_at * 1000,
        isSpoiler
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
  const pool = getSharedPool();
  
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
  const pool = getSharedPool();
  
  try {
    console.log("Fetching reviews for user:", pubkey);
    const filter: Filter = {
      kinds: [NOSTR_KINDS.REVIEW],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} review events for user ${pubkey}`);
    
    const reviews: BookReview[] = [];
    
    for (const event of events) {
      // Extract ISBN from the "d" tag with format "isbn:XXXXXXXXXX"
      const dTags = event.tags.filter(tag => tag[0] === 'd');
      let isbn: string | null = null;
      
      for (const tag of dTags) {
        if (tag[1] && tag[1].startsWith('isbn:')) {
          isbn = tag[1].replace('isbn:', '');
          break;
        }
      }
      
      // If no ISBN found in d tags, try looking in i tags
      if (!isbn) {
        const iTags = event.tags.filter(tag => tag[0] === 'i');
        for (const tag of iTags) {
          if (tag[1] && tag[1].startsWith('isbn:')) {
            isbn = tag[1].replace('isbn:', '');
            break;
          }
        }
      }
      
      if (!isbn) {
        console.warn(`No ISBN found for review ${event.id}, checking for alt tags`);
        // Final fallback: check for any tag that might contain ISBN
        for (const tag of event.tags) {
          if (tag[1] && typeof tag[1] === 'string' && tag[1].includes('isbn')) {
            const match = tag[1].match(/isbn:?(\d+)/i);
            if (match && match[1]) {
              isbn = match[1];
              console.log(`Found ISBN in non-standard tag: ${isbn}`);
              break;
            }
          }
        }
      }
      
      // Extract rating
      const rating = extractRatingFromTags(event);
      
      // Log review info for debugging
      console.log(`Review ${event.id}: ISBN=${isbn}, Rating=${rating}`);
      
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
      .filter((isbn): isbn is string => isbn !== null && isbn !== undefined);
    
    console.log(`Found ${isbns.length} unique ISBNs in user reviews`);
    
    if (isbns.length > 0) {
      try {
        const books = await getBooksByISBN([...new Set(isbns)]);
        console.log(`Retrieved ${books.length} books from OpenLibrary`);
        
        // Add book titles and authors to reviews
        reviews.forEach(review => {
          if (review.bookIsbn) {
            const book = books.find(b => b.isbn === review.bookIsbn);
            if (book) {
              review.bookTitle = book.title;
              review.bookCover = book.coverUrl;
              review.bookAuthor = book.author;
              console.log(`Matched book data for ISBN ${review.bookIsbn}: ${book.title}`);
            } else {
              console.warn(`No book data found for ISBN ${review.bookIsbn}`);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching books for reviews:", error);
      }
    }
    
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
}
