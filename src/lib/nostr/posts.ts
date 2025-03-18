
import { toast } from "@/hooks/use-toast";
import { Post, Book, NOSTR_KINDS, SocialActivity } from "./types";
import { publishToNostr } from "./publish";
import { getCurrentUser, isLoggedIn } from "./user";
import { mockPosts } from "./types";
import { SimplePool, type Filter } from "nostr-tools";
import { getUserRelays } from "./relay";
import { fetchUserProfiles } from "./profile";

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
    if (params.book) {
      tags.push(["i", params.book.isbn, "book"]);
      tags.push(["title", params.book.title]);
      if (params.book.author) {
        tags.push(["author", params.book.author]);
      }
      if (params.book.coverUrl) {
        tags.push(["cover", params.book.coverUrl]);
      }
    }
    
    // Add media if provided
    if (params.mediaFile && params.mediaType) {
      // For simplicity, in a real app you'd upload to a service and store the URL
      // Here we just mention it in a tag
      tags.push(["media", params.mediaType]);
    }
    
    // Add spoiler tag if needed
    if (params.isSpoiler) {
      tags.push(["spoiler", "true"]);
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
  
  try {
    const relayUrls = getUserRelays();
    const pool = new SimplePool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      limit: limit
    };
    
    const events = await pool.list(relayUrls, [filter]);
    
    const posts: Post[] = [];
    const userPubkeys = new Set<string>();
    
    for (const event of events) {
      // Only include posts that have book tags
      const bookTag = event.tags.find(tag => tag[0] === 'i' && tag[2] === 'book');
      if (!bookTag) continue;
      
      userPubkeys.add(event.pubkey);
      
      const titleTag = event.tags.find(tag => tag[0] === 'title');
      const coverTag = event.tags.find(tag => tag[0] === 'cover');
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      
      const post: Post = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at * 1000,
        taggedBook: {
          isbn: bookTag[1],
          title: titleTag ? titleTag[1] : "Unknown Book",
          coverUrl: coverTag ? coverTag[1] : ""
        },
        mediaType: mediaTag ? (mediaTag[1] as "image" | "video") : undefined,
        mediaUrl: undefined, // We'd resolve this from a storage service in a real app
        isSpoiler: !!spoilerTag && spoilerTag[1] === "true",
        reactions: {
          count: 0,
          userReacted: false
        }
      };
      
      posts.push(post);
    }
    
    // Fetch user profiles for authors
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
    
    pool.close(relayUrls);
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
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
    const pool = new SimplePool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      '#i': [isbn]
    };
    
    const events = await pool.list(relayUrls, [filter]);
    
    // Process events similarly to fetchPosts
    // ... processing code here ...
    
    pool.close(relayUrls);
    return []; // Replace with actual posts
  } catch (error) {
    console.error(`Error fetching posts for book ${isbn}:`, error);
    return [];
  }
}

/**
 * Fetch posts by a specific user
 */
export async function fetchUserPosts(pubkey: string, useMockData: boolean = true): Promise<Post[]> {
  if (useMockData) {
    return mockPosts.filter(post => post.pubkey === pubkey);
  }
  
  try {
    const relayUrls = getUserRelays();
    const pool = new SimplePool();
    
    const filter: Filter = {
      kinds: [NOSTR_KINDS.TEXT_NOTE],
      authors: [pubkey],
      limit: 50
    };
    
    const events = await pool.list(relayUrls, [filter]);
    
    // Process events similarly to fetchPosts
    // ... processing code here ...
    
    pool.close(relayUrls);
    return []; // Replace with actual posts
  } catch (error) {
    console.error(`Error fetching posts for user ${pubkey}:`, error);
    return [];
  }
}
