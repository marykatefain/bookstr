
import { toast } from "@/hooks/use-toast";
import { Post, Book, NOSTR_KINDS, SocialActivity } from "./types";
import { publishToNostr } from "./publish";
import { getCurrentUser, isLoggedIn } from "./user";
import { mockPosts } from "./types";
import { SimplePool, type Filter } from "nostr-tools";
import { getUserRelays } from "./relay";
import { fetchUserProfiles } from "./profile";
import { fetchBookPostsByISBN } from "./fetch/socialFetch";
import { getSharedPool } from "./utils/poolManager";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

interface CreatePostParams {
  content: string;
  book?: Book | null;
  mediaFile?: File | null;
  mediaType?: "image" | "video" | null;
  isSpoiler?: boolean;
}

/**
 * Create a new book post
 */
export async function createBookPost(params: CreatePostParams): Promise<boolean> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to post",
        variant: "destructive"
      });
      return false;
    }

    // Build tags
    const tags: string[][] = [];
    
    // Add book tag if provided
    if (params.book?.isbn) {
      tags.push(["i", `isbn:${params.book.isbn}`]);
      // k tag added in publishToNostr function
    }
    
    // Add the bookstr tag for all kind 1 events
    tags.push(["t", "bookstr"]);
    
    // Add media if provided
    if (params.mediaFile && params.mediaType) {
      tags.push(["media", params.mediaType]);
    }
    
    // Add content-warning tag if spoiler is marked (using standard Nostr tag)
    if (params.isSpoiler) {
      const bookTitle = params.book?.title || "Book";
      tags.push(["content-warning", `Spoiler: "${bookTitle}"`]);
    }
    
    // Create the event
    const eventData = {
      kind: NOSTR_KINDS.TEXT_NOTE,
      content: params.content,
      tags: tags
    };
    
    const eventId = await publishToNostr(eventData);
    return eventId !== null;
  } catch (error) {
    console.error("Error creating book post:", error);
    toast({
      title: "Error",
      description: "Failed to create post",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Fetch posts from Nostr or use mock data
 */
export async function fetchPosts(limit: number = 20, useMockData: boolean = true): Promise<Post[]> {
  if (useMockData) {
    return mockPosts;
  }
  
  // This now delegates to fetchBookPosts which includes the tag filtering logic
  return fetchBookPostsByISBN(undefined, false);
}

/**
 * Fetch posts for a specific book by ISBN
 */
export async function fetchBookPosts(isbn: string, useMockData: boolean = true): Promise<Post[]> {
  if (useMockData) {
    return mockPosts.filter(post => post.taggedBook?.isbn === isbn);
  }
  
  try {
    const relayUrls = getUserRelays();
    const pool = getSharedPool();
    
    // Create two filters: one for k=isbn and one for t=bookstr
    const isbnFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      '#i': [`isbn:${isbn}`],
      '#k': ['isbn']
    };
    
    const bookstrFilter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      '#i': [`isbn:${isbn}`],
      '#t': ['bookstr']
    };
    
    // Query both filters in parallel
    const [isbnEvents, bookstrEvents] = await Promise.all([
      pool.querySync(relayUrls, isbnFilter),
      pool.querySync(relayUrls, bookstrFilter)
    ]);
    
    // Combine and deduplicate events
    const combinedEvents = [...isbnEvents, ...bookstrEvents];
    const uniqueEvents = Array.from(new Map(combinedEvents.map(event => [event.id, event])).values());
    
    // Process events to create posts
    const posts: Post[] = [];
    const userPubkeys = new Set<string>();
    
    for (const event of uniqueEvents) {
      userPubkeys.add(event.pubkey);
      
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      posts.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000,
        taggedBook: {
          isbn: isbn,
          title: "Book", // Will be updated with actual title
          coverUrl: `${API_BASE_URL}/covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        },
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        mediaUrl: mediaTag ? mediaTag[2] : undefined,
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true",
        reactions: {
          count: 0,
          userReacted: false
        }
      });
    }
    
    // Fetch user profiles for post authors
    if (userPubkeys.size > 0) {
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
    
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error(`Error fetching posts for book ${isbn}:`, error);
    return [];
  }
}

/**
 * Fetch posts by a specific user
 */
export async function fetchUserPosts(pubkey: string, useMockData: boolean = true): Promise<Post[]> {
  // Use imported fetchBookPosts with renamed import to avoid conflict
  return fetchBookPostsByISBN(pubkey, useMockData);
}
