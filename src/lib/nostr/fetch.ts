
import { SimplePool, type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS, NostrProfile, BookReview, SocialActivity, FollowList } from "./types";
import { getUserRelays } from "./relay";
import { getCurrentUser } from "./user";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";

/**
 * Extract ISBN from a tag
 */
function extractISBNFromTags(event: Event): string | null {
  // Check for direct ISBN tag (i tag)
  const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  if (isbnTag && isbnTag[1]) {
    return isbnTag[1].replace('isbn:', '');
  }
  
  return null;
}

/**
 * Extract rating from tags
 */
function extractRatingFromTags(event: Event): number | undefined {
  const ratingTag = event.tags.find(tag => tag[0] === 'rating');
  if (ratingTag && ratingTag[1]) {
    const rating = parseInt(ratingTag[1], 10);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
  }
  return undefined;
}

/**
 * Determine reading status from event kind
 */
function getReadingStatusFromEventKind(eventKind: number): 'tbr' | 'reading' | 'finished' {
  if (eventKind === NOSTR_KINDS.BOOK_TBR) return 'tbr';
  if (eventKind === NOSTR_KINDS.BOOK_READING) return 'reading';
  if (eventKind === NOSTR_KINDS.BOOK_READ) return 'finished';
  
  // Default to tbr if not recognized
  return 'tbr';
}

/**
 * Convert a Nostr event to a Book object
 */
function eventToBook(event: Event): Book | null {
  try {
    // Extract ISBN from tags
    const isbn = extractISBNFromTags(event);
    
    if (!isbn) {
      console.warn('Missing ISBN tag in event:', event);
      return null;
    }
    
    // Default book with required fields
    const book: Book = {
      id: event.id,
      title: "", // Will be filled in later
      author: "", // Will be filled in later
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEventKind(event.kind),
      dateAdded: event.created_at * 1000,
    };
    
    return { ...book, readingStatus };
  } catch (error) {
    console.error('Error parsing book from event:', error);
    return null;
  }
}

/**
 * Fetch user's books from relays
 */
export async function fetchUserBooks(pubkey: string): Promise<{
  tbr: Book[],
  reading: Book[],
  read: Book[]
}> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    // Create a filter for all book event kinds
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING,
        NOSTR_KINDS.BOOK_READ
      ],
      authors: [pubkey],
      limit: 1000 // Increased limit from default to 1000
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} book events`);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Extract book details from events and deduplicate by ISBN
    const bookEvents = events.map(event => eventToBook(event)).filter(book => book !== null) as Book[];
    const uniqueBooks = new Map<string, Book>();
    
    // Group by ISBN and keep the most recent event for each ISBN based on status
    bookEvents.forEach(book => {
      if (!book.isbn || !book.readingStatus) return;
      
      const existingBook = uniqueBooks.get(book.isbn);
      
      // If we don't have this ISBN yet, or if this event is newer than what we have
      if (!existingBook || 
          (book.readingStatus.dateAdded > (existingBook.readingStatus?.dateAdded || 0))) {
        uniqueBooks.set(book.isbn, book);
      }
    });
    
    // Now we have unique books by ISBN with the most recent status
    const dedupedBooks = Array.from(uniqueBooks.values());
    
    // Extract all unique ISBNs 
    const isbns = dedupedBooks.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0) as string[];
    
    // Fetch additional book details from OpenLibrary if we have ISBNs
    if (isbns.length > 0) {
      try {
        const bookDetails = await getBooksByISBN(isbns);
        
        // Create a map for quick lookup
        const bookDetailsMap = new Map<string, Partial<Book>>();
        bookDetails.forEach(book => {
          if (book.isbn) {
            bookDetailsMap.set(book.isbn, book);
          }
        });
        
        // Enhance books with OpenLibrary data
        dedupedBooks.forEach(book => {
          if (!book.isbn || !book.readingStatus) return;
          
          const details = bookDetailsMap.get(book.isbn);
          if (details) {
            // Merge the details while preserving the id and reading status
            Object.assign(book, {
              ...details,
              id: book.id, // Keep the original Nostr event ID
              readingStatus: book.readingStatus // Keep the reading status
            });
          }
          
          const status = book.readingStatus.status;
          if (status === 'reading') {
            readingBooks.push(book);
          } else if (status === 'finished') {
            readBooks.push(book);
          } else {
            tbrBooks.push(book);
          }
        });
      } catch (error) {
        console.error('Error enhancing books with OpenLibrary data:', error);
        // Fall back to using basic book data without enhancements
        dedupedBooks.forEach(book => {
          if (!book.readingStatus) return;
          
          const status = book.readingStatus.status;
          if (status === 'reading') {
            readingBooks.push(book);
          } else if (status === 'finished') {
            readBooks.push(book);
          } else {
            tbrBooks.push(book);
          }
        });
      }
    } else {
      // No ISBNs, just use the basic book data
      dedupedBooks.forEach(book => {
        if (!book.readingStatus) return;
        
        const status = book.readingStatus.status;
        if (status === 'reading') {
          readingBooks.push(book);
        } else if (status === 'finished') {
          readBooks.push(book);
        } else {
          tbrBooks.push(book);
        }
      });
    }
    
    console.log(`Categorized books: TBR=${tbrBooks.length}, Reading=${readingBooks.length}, Read=${readBooks.length}`);
    
    return {
      tbr: tbrBooks,
      reading: readingBooks,
      read: readBooks
    };
  } catch (error) {
    console.error('Error fetching books from relays:', error);
    return { tbr: [], reading: [], read: [] };
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch multiple books by their ISBNs
 */
export async function fetchBooksByISBN(isbns: string[]): Promise<Book[]> {
  const validIsbns = isbns.filter(isbn => isbn && isbn.length > 0);
  if (validIsbns.length === 0) {
    return [];
  }
  return getBooksByISBN(validIsbns);
}

/**
 * Fetch a single book by ISBN
 */
export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    return null;
  }
  return getBookByISBN(isbn);
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
 * Get the list of users a person follows
 */
export async function fetchFollowingList(pubkey: string): Promise<FollowList> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.CONTACTS],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    
    // Use the most recent CONTACTS event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!latestEvent) {
      return { follows: [] };
    }
    
    // Extract followed pubkeys from p tags
    const follows = latestEvent.tags
      .filter(tag => tag[0] === 'p')
      .map(tag => tag[1]);
    
    return { follows };
  } catch (error) {
    console.error("Error fetching following list:", error);
    return { follows: [] };
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch profile for a user
 */
export async function fetchUserProfile(pubkey: string): Promise<NostrProfile | null> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    const filter: Filter = {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: [pubkey]
    };
    
    const events = await pool.querySync(relays, filter);
    
    // Use the most recent profile event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!latestEvent) {
      return null;
    }
    
    try {
      const profileData = JSON.parse(latestEvent.content);
      
      return {
        npub: pubkey, // This will be converted to npub format in the UI
        pubkey: pubkey,
        name: profileData.name,
        display_name: profileData.display_name,
        picture: profileData.picture,
        about: profileData.about,
        website: profileData.website,
        lud16: profileData.lud16,
        banner: profileData.banner,
        relays: []
      };
    } catch (error) {
      console.error("Error parsing profile data:", error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch social activity from people you follow
 */
export async function fetchSocialFeed(limit = 20): Promise<SocialActivity[]> {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.log("Cannot fetch social feed: User not logged in");
    return [];
  }
  
  // First, get the list of people the user follows
  const { follows } = await fetchFollowingList(currentUser.pubkey);
  
  if (follows.length === 0) {
    console.log("User doesn't follow anyone yet");
    return [];
  }
  
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    // Fetch book-related events from followed users
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING, 
        NOSTR_KINDS.BOOK_READ,
        NOSTR_KINDS.BOOK_RATING,
        NOSTR_KINDS.REVIEW
      ],
      authors: follows,
      limit
    };
    
    const events = await pool.querySync(relays, filter);
    
    // Get all unique pubkeys to fetch profiles
    const uniquePubkeys = [...new Set(events.map(event => event.pubkey))];
    
    // Fetch profiles for these pubkeys
    const profileFilter: Filter = {
      kinds: [NOSTR_KINDS.SET_METADATA],
      authors: uniquePubkeys
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
    
    // Extract all ISBNs to fetch book details
    const isbns = events
      .map(event => extractISBNFromTags(event))
      .filter((isbn): isbn is string => isbn !== null);
    
    // Fetch book details
    const books = await getBooksByISBN([...new Set(isbns)]);
    
    // Create a map of ISBN to book details
    const bookMap = new Map<string, Book>();
    books.forEach(book => {
      if (book.isbn) {
        bookMap.set(book.isbn, book);
      }
    });
    
    // Convert events to social activities
    const socialFeed: SocialActivity[] = [];
    
    for (const event of events) {
      const isbn = extractISBNFromTags(event);
      
      if (!isbn) {
        continue; // Skip events without ISBN
      }
      
      // Get book details from the map or create a basic book object
      let book = bookMap.get(isbn);
      
      if (!book) {
        // Basic book object if we couldn't fetch details
        book = {
          id: `isbn:${isbn}`,
          title: "Unknown Book",
          author: "Unknown Author",
          isbn,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        };
      }
      
      // Determine activity type based on event kind
      let activityType: 'review' | 'rating' | 'tbr' | 'reading' | 'finished';
      
      switch (event.kind) {
        case NOSTR_KINDS.REVIEW:
          activityType = 'review';
          break;
        case NOSTR_KINDS.BOOK_RATING:
          activityType = 'rating';
          break;
        case NOSTR_KINDS.BOOK_TBR:
          activityType = 'tbr';
          break;
        case NOSTR_KINDS.BOOK_READING:
          activityType = 'reading';
          break;
        case NOSTR_KINDS.BOOK_READ:
          activityType = 'finished';
          break;
        default:
          continue; // Skip unknown event kinds
      }
      
      // Create social activity object
      const activity: SocialActivity = {
        id: event.id,
        pubkey: event.pubkey,
        type: activityType,
        book,
        content: event.content,
        rating: extractRatingFromTags(event),
        createdAt: event.created_at * 1000,
        author: profileMap.get(event.pubkey),
        reactions: {
          count: 0,
          userReacted: false
        }
      };
      
      socialFeed.push(activity);
    }
    
    // Sort by creation date, newest first
    return socialFeed.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching social feed:", error);
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

/**
 * Simple placeholder for backward compatibility
 */
export async function ensureBookMetadata(book: Book): Promise<string | null> {
  console.log("Book metadata is no longer needed in the simplified approach");
  return "placeholder"; // Return a non-null value to avoid errors
}
