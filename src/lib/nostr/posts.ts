
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
import { uploadMedia } from "@/lib/media";
import { uploadMediaToBlossom } from "@/lib/media/blossom";

// Base URL for the Cloudflare Worker
const API_BASE_URL = "https://bookstr.xyz/api/openlibrary";

interface CreatePostParams {
  content: string;
  book?: Book | null;
  mediaFile?: File | null;
  mediaType?: "image" | "video" | null;
  isSpoiler?: boolean;
  altText?: string;
  onMediaUploadProgress?: (progress: number) => void;
}

/**
 * Create a new book post
 */
export async function createBookPost(params: CreatePostParams): Promise<{success: boolean; mediaUrl?: string}> {
  try {
    if (!isLoggedIn()) {
      toast({
        title: "Login required",
        description: "Please sign in to post",
        variant: "destructive"
      });
      return { success: false };
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
    
    // Prepare content - we'll append media URL if one is uploaded
    let finalContent = params.content;
    
    // Upload media to service if provided
    let mediaUrl: string | undefined;
    let uploadService: string | undefined;
    
    if (params.mediaFile && params.mediaType) {
      try {
        // Show uploading toast
        const uploadToast = toast({
          title: "Uploading media to Blossom",
          description: "Please wait while we upload your media...",
          duration: 60000, // Long duration while uploading
        });
        
        // Upload to Blossom using the improved implementation
        const uploadResult = await uploadMediaToBlossom({
          file: params.mediaFile,
          altText: params.altText,
          onProgress: params.onMediaUploadProgress
        });
        
        // Dismiss the upload toast
        uploadToast.dismiss();
        
        // Get media URL from the response
        mediaUrl = uploadResult.url;
        uploadService = "Blossom";
        
        // Show success toast
        toast({
          title: "Media uploaded successfully",
          description: `Your media was uploaded to Blossom.`,
          duration: 3000,
        });
        
        if (mediaUrl) {
          // 1. Append the URL to the content text with newlines for separation
          // This ensures clients that don't support media tags can still show the media
          if (finalContent.trim()) {
            finalContent += '\n\n';
          }
          finalContent += mediaUrl;
          
          // 2. Add "imeta" tag for better client compatibility (NIP-114)
          // Create imeta tag with available metadata
          const imetaTag = ["imeta", `url ${mediaUrl}`, `m ${params.mediaType}/${uploadResult.type?.split('/')[1] || 'jpeg'}`];
          
          // Add alt text if available
          if (params.altText) {
            imetaTag.push(`alt ${params.altText}`);
          }
          
          // Add dimensions if available
          if (uploadResult.dim) {
            imetaTag.push(`dim ${uploadResult.dim}`);
          }
          
          // Add hash for verifiability 
          if (uploadResult.sha256) {
            imetaTag.push(`x ${uploadResult.sha256}`);
          }
          
          // Add service information as metadata
          imetaTag.push(`service Blossom`);
          
          tags.push(imetaTag);
          
          // 3. Also add traditional media tag for backward compatibility
          tags.push(["media", `${params.mediaType}/${uploadResult.type?.split('/')[1] || 'jpeg'}`, mediaUrl, params.altText || ""]);
        }
      } catch (uploadError) {
        console.error("Error uploading media:", uploadError);
        toast({
          title: "Media upload failed",
          description: "Could not upload your media. Your post will be created without media.",
          variant: "destructive"
        });
      }
    }
    
    // Add content-warning tag if spoiler is marked (using standard Nostr tag)
    if (params.isSpoiler) {
      const bookTitle = params.book?.title || "Book";
      tags.push(["content-warning", `Spoiler: ${bookTitle}`]);
    }
    
    // Create the event
    const eventData = {
      kind: NOSTR_KINDS.TEXT_NOTE,
      content: finalContent,
      tags: tags
    };
    
    const eventId = await publishToNostr(eventData);
    return { 
      success: eventId !== null,
      mediaUrl: mediaUrl 
    };
  } catch (error) {
    console.error("Error creating book post:", error);
    toast({
      title: "Error",
      description: "Failed to create post",
      variant: "destructive"
    });
    return { success: false };
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
            name: authorProfile.name || authorProfile.name,
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
