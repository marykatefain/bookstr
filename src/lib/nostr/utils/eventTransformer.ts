
import { Event } from "nostr-tools";
import { SocialActivity, Book } from "@/lib/nostr/types";
import { NOSTR_KINDS } from "@/lib/nostr/types/constants";
import { extractISBNFromTags, extractRatingFromTags, getReadingStatusFromEventKind } from "./eventUtils";
import { fetchReactions, fetchReplies } from "@/lib/nostr";

// Transform raw nostr events to SocialActivity objects
export async function transformEventsToActivities(
  events: Event[], 
  profiles: Record<string, { name?: string; picture?: string; npub?: string }>
): Promise<SocialActivity[]> {
  const activities: SocialActivity[] = [];
  
  // Process each event
  for (const event of events) {
    try {
      // Extract ISBN from tags
      const isbn = extractISBNFromTags(event);
      
      // Extract any book title from tags
      const titleTag = event.tags.find(tag => tag[0] === 'title');
      const title = titleTag ? titleTag[1] : 'Unknown Book';
      
      // Extract cover URL from tags
      const coverTag = event.tags.find(tag => tag[0] === 'cover' || tag[0] === 'image');
      const coverUrl = coverTag ? coverTag[1] : '';
      
      // Extract author info
      const author = profiles[event.pubkey] || {
        name: undefined,
        picture: undefined,
        npub: undefined
      };
      
      // Create book object - ensuring id property is included
      const book: Book = {
        id: `nostr:${event.id}`, // Ensure we have an id
        isbn: isbn || 'unknown',
        title: title,
        coverUrl: coverUrl,
        author: '' // Single author as string
      };
      
      // Determine type of activity based on event kind
      let type: SocialActivity['type'] = 'post';
      let rating: number | undefined;
      
      switch (event.kind) {
        case NOSTR_KINDS.BOOK_TBR:
          type = 'tbr';
          break;
        case NOSTR_KINDS.BOOK_READING:
          type = 'reading';
          break;
        case NOSTR_KINDS.BOOK_READ:
          type = 'finished';
          break;
        case NOSTR_KINDS.BOOK_RATING:
        case NOSTR_KINDS.REVIEW:
          rating = extractRatingFromTags(event);
          type = rating ? 'rating' : 'review';
          if (event.content.trim().length > 0) {
            type = 'review';
          }
          break;
        case NOSTR_KINDS.TEXT_NOTE:
          type = 'post';
          break;
      }
      
      // Get media from tags
      const mediaTag = event.tags.find(tag => tag[0] === 'media');
      const mediaUrl = mediaTag ? mediaTag[1] : undefined;
      const mediaType = mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 
                        mediaUrl?.match(/\.(mp4|mov|webm)$/i) ? 'video' : undefined;
      
      // Check if post has spoiler tag
      const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
      const isSpoiler = !!spoilerTag;
      
      // Create the activity object
      const activity: SocialActivity = {
        id: event.id,
        pubkey: event.pubkey,
        type,
        book,
        content: event.content,
        rating,
        createdAt: event.created_at * 1000, // Convert to milliseconds
        author,
        mediaUrl,
        mediaType,
        isSpoiler
      };
      
      activities.push(activity);
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      // Skip this event and continue with the rest
    }
  }
  
  // For simplicity, let's skip batch fetching reactions and replies for now
  // to reduce network requests
  
  return activities;
}
