import { type Filter } from "nostr-tools";
import { Post, NOSTR_KINDS } from "../../types";
import { getUserRelays } from "../../relay";
import { fetchUserProfiles } from "../../profile";
import { getBooksByISBN } from "@/lib/openlibrary";
import { getSharedPool } from "../../utils/poolManager";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

/**
 * Fetch posts that have book tags (kind 1 with 'i' tag)
 */
export async function fetchBookPosts(pubkey?: string, useMockData: boolean = false): Promise<Post[]> {
  const limit = 20; // Hard-coded limit to 20
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  try {
    console.log("Fetching book posts from relays:", relays);
    console.log("For pubkey:", pubkey || "all users");
    
    // Base filter for all posts
    const baseFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      limit: limit
    };
    
    // If pubkey is provided, only fetch posts from that user
    if (pubkey) {
      baseFilter.authors = [pubkey];
    }
    
    // Create separate filters for k=isbn and t=bookstr
    const isbnFilter = { ...baseFilter, "#k": ["isbn"] };
    const bookstrFilter = { ...baseFilter, "#t": ["bookstr"] };
    
    // Execute queries in parallel
    const [isbnEvents, bookstrEvents] = await Promise.all([
      pool.querySync(relays, isbnFilter),
      pool.querySync(relays, bookstrFilter)
    ]);
    
    console.log(`Found ${isbnEvents.length} posts with k=isbn and ${bookstrEvents.length} posts with t=bookstr`);
    
    // Combine events, removing duplicates
    const eventMap = new Map();
    
    // Add all events to the map, using the event ID as the key
    [...isbnEvents, ...bookstrEvents].forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Convert back to array
    const allEvents = Array.from(eventMap.values());
    console.log(`Combined into ${allEvents.length} unique events`);
    
    // Filter out reply posts (posts with 'e' tags)
    const nonReplyEvents = allEvents.filter(event => 
      !event.tags.some(tag => tag[0] === 'e')
    );
    
    console.log(`Filtered out ${allEvents.length - nonReplyEvents.length} reply posts, leaving ${nonReplyEvents.length} top-level posts`);
    
    // Process events to extract posts
    const posts: Post[] = [];
    const userPubkeys = new Set<string>();
    
    for (const event of nonReplyEvents) {
      userPubkeys.add(event.pubkey);
      
      // Extract ISBN from the tag (could be in format "isbn:1234567890" or just the ISBN)
      const bookTag = event.tags.find(tag => tag[0] === 'i');
      let isbn = "";
      
      if (bookTag) {
        const isbnValue = bookTag[1];
        isbn = isbnValue.startsWith('isbn:') 
          ? isbnValue.substring(5) 
          : isbnValue;
      }
      
      // Find optional media tags
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      // Create post object
      const post: Post = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000,
        taggedBook: isbn ? {
          isbn: isbn,
          title: "Book", // Will be updated when we fetch book details
          coverUrl: `${API_BASE_URL}/covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        } : undefined,
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true",
        reactions: {
          count: 0,
          userReacted: false
        }
      };
      
      posts.push(post);
    }
    
    // Fetch user profiles for post authors
    if (userPubkeys.size > 0) {
      console.log("Fetching profiles for authors:", Array.from(userPubkeys));
      const profiles = await fetchUserProfiles(Array.from(userPubkeys));
      
      // Add author information to posts
      for (const post of posts) {
        const authorProfile = profiles.find(p => p.pubkey === post.pubkey);
        if (authorProfile) {
          post.author = {
            name: authorProfile.name || authorProfile.display_name,
            picture: authorProfile.picture,
            npub: authorProfile.npub
          };
        }
      }
    }
    
    // Get all unique ISBNs to fetch book details
    const isbns = posts
      .map(post => post.taggedBook?.isbn)
      .filter((isbn): isbn is string => Boolean(isbn));
    
    if (isbns.length > 0) {
      try {
        console.log("Fetching book details for ISBNs:", isbns);
        // Fetch book details
        const books = await getBooksByISBN([...new Set(isbns)]);
        
        // Update post objects with book details
        for (const post of posts) {
          if (post.taggedBook?.isbn) {
            const book = books.find(b => b.isbn === post.taggedBook?.isbn);
            if (book) {
              post.taggedBook = {
                isbn: book.isbn,
                title: book.title,
                coverUrl: book.coverUrl || post.taggedBook.coverUrl
              };
            }
          }
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    }
    
    console.log("Final processed posts:", posts.length);
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching book posts:", error);
    return [];
  }
}
