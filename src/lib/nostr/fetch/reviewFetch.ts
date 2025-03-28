import { type Filter, type Event } from "nostr-tools";
import { BookReview, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { extractISBNFromTags, extractRatingFromTags } from "../utils/eventUtils";
import { getBooksByISBN } from "@/lib/openlibrary";
import { getSharedPool } from "../utils/poolManager";
import { throttlePromises } from "@/lib/utils";

/**
 * Extracts spoiler information from event tags
 */
function extractSpoilerInfo(event: Event): boolean {
  const contentWarningTag = event.tags.find(tag => tag[0] === 'content-warning');
  const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
  return !!contentWarningTag || (!!spoilerTag && spoilerTag[1] === "true");
}

/**
 * Fetches and processes author profiles for a list of reviews
 */
async function fetchAuthorProfiles(reviews: BookReview[]): Promise<BookReview[]> {
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  // Extract unique author pubkeys
  const authorPubkeys = [...new Set(reviews.map(review => review.pubkey))];
  
  if (authorPubkeys.length === 0) {
    return reviews;
  }
  
  try {
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
    return reviews.map(review => {
      if (profileMap.has(review.pubkey)) {
        return {
          ...review,
          author: profileMap.get(review.pubkey)
        };
      }
      return review;
    });
  } catch (error) {
    console.error("Error fetching author profiles:", error);
    return reviews;
  }
}

/**
 * Filter reviews to keep only the most recent review per user
 * This prevents multiple reviews from the same user from appearing
 */
function filterDuplicateReviews(reviews: BookReview[]): BookReview[] {
  // Create a map to store the most recent review from each user
  const userLatestReviews = new Map<string, BookReview>();
  
  // Process each review
  reviews.forEach(review => {
    // Get existing review for this user (if any)
    const existingReview = userLatestReviews.get(review.pubkey);
    
    // If no existing review or current review is more recent, update the map
    if (!existingReview || review.createdAt > existingReview.createdAt) {
      userLatestReviews.set(review.pubkey, review);
    }
  });
  
  // Return the values (most recent reviews) from the map
  return Array.from(userLatestReviews.values());
}

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
      // Extract rating from tags - if present
      const rating = extractRatingFromTags(event);
      
      // Check for spoiler tag
      const isSpoiler = extractSpoilerInfo(event);
      
      reviews.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        rating,
        createdAt: event.created_at * 1000,
        isSpoiler
      });
    }
    
    // Fetch author profiles
    const reviewsWithAuthors = await fetchAuthorProfiles(reviews);
    
    // Filter out duplicate reviews by the same user, keeping only the most recent
    const filteredReviews = filterDuplicateReviews(reviewsWithAuthors);
    
    // Return sorted reviews (most recent first)
    return filteredReviews.sort((a, b) => b.createdAt - a.createdAt);
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
      
      if (rating !== null) {
        ratings.push({
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          rating,
          createdAt: event.created_at * 1000
        });
      }
    }
    
    // Fetch author profiles
    const ratingsWithAuthors = await fetchAuthorProfiles(ratings);
    
    // Filter out duplicate ratings by the same user, keeping only the most recent
    const filteredRatings = filterDuplicateReviews(ratingsWithAuthors);
    
    // Return sorted ratings (most recent first)
    return filteredRatings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book ratings:", error);
    return [];
  }
}

/**
 * Extract ISBN from event tags, checking multiple possible locations
 */
function extractISBNFromEventTags(event: Event): string | null {
  // Check in "d" tags first (format "isbn:XXXXXXXXXX")
  const dTags = event.tags.filter(tag => tag[0] === 'd');
  for (const tag of dTags) {
    if (tag[1] && tag[1].startsWith('isbn:')) {
      return tag[1].replace('isbn:', '');
    }
  }
  
  // Then check in "i" tags
  const iTags = event.tags.filter(tag => tag[0] === 'i');
  for (const tag of iTags) {
    if (tag[1] && tag[1].startsWith('isbn:')) {
      return tag[1].replace('isbn:', '');
    }
  }
  
  // Final fallback: check for any tag that might contain ISBN
  for (const tag of event.tags) {
    if (tag[1] && typeof tag[1] === 'string' && tag[1].includes('isbn')) {
      const match = tag[1].match(/isbn:?(\d+)/i);
      if (match && match[1]) {
        console.log(`Found ISBN in non-standard tag: ${match[1]}`);
        return match[1];
      }
    }
  }
  
  return null;
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
      // Extract ISBN from event tags
      const isbn = extractISBNFromEventTags(event);
      
      // Extract rating from tags
      const rating = extractRatingFromTags(event);
      
      // Check for spoiler tags
      const isSpoiler = extractSpoilerInfo(event);
      
      // Log review info for debugging
      console.log(`Review ${event.id}: ISBN=${isbn}, Rating=${rating}, isSpoiler=${isSpoiler}`);
      
      reviews.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        rating,
        bookIsbn: isbn,
        createdAt: event.created_at * 1000,
        isSpoiler
      });
    }
    
    // Group reviews by ISBN to keep only the latest per book
    const reviewsByIsbn = new Map<string, BookReview>();
    
    reviews.forEach(review => {
      if (review.bookIsbn) {
        const existingReview = reviewsByIsbn.get(review.bookIsbn);
        
        // If no existing review for this ISBN or this one is more recent, update the map
        if (!existingReview || review.createdAt > existingReview.createdAt) {
          reviewsByIsbn.set(review.bookIsbn, review);
        }
      }
    });
    
    // Get de-duplicated reviews
    const deduplicatedReviews = Array.from(reviewsByIsbn.values());
    
    // First get author profiles for the reviews
    const reviewsWithAuthors = await fetchAuthorProfiles(deduplicatedReviews);
    
    // Then fetch book details if we have ISBNs
    const isbns = reviewsWithAuthors
      .map(review => review.bookIsbn)
      .filter((isbn): isbn is string => isbn !== null && isbn !== undefined);
    
    console.log(`Found ${isbns.length} unique ISBNs in user reviews`);
    
    if (isbns.length > 0) {
      try {
        const books = await getBooksByISBN([...new Set(isbns)]);
        console.log(`Retrieved ${books.length} books from OpenLibrary`);
        
        // Add book info to reviews
        return reviewsWithAuthors.map(review => {
          if (review.bookIsbn) {
            const book = books.find(b => b.isbn === review.bookIsbn);
            if (book) {
              return {
                ...review,
                bookTitle: book.title,
                bookCover: book.coverUrl,
                bookAuthor: book.author
              };
            }
          }
          return review;
        }).sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        console.error("Error fetching books for reviews:", error);
      }
    }
    
    return reviewsWithAuthors.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
}
