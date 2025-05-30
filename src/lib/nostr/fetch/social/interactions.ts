import { type Event, type Filter } from "nostr-tools";
import { NOSTR_KINDS } from "../../types";
import { getUserRelays } from "../../relay";
import { Reply } from "../../types/common";
import { getSharedPool } from "../../utils/poolManager";
import { cacheQueryResult, getCachedQueryResult, generateCacheKey } from "../../relay/connection";
import { getCurrentUser } from "../../user";
import { filterBlockedEvents, isBlocked } from "../../utils/blocklist";

// Cache TTL for interactions (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch reactions (Kind 7) for a specific event
 */
export async function fetchReactions(eventId: string): Promise<{
  count: number;
  userReacted: boolean;
}> {
  return fetchReactionsForEvent(eventId);
}

/**
 * Fetch reactions (Kind 7) for a specific event
 */
export async function fetchReactionsForEvent(eventId: string): Promise<{
  count: number;
  userReacted: boolean;
}> {
  if (!eventId) {
    return { count: 0, userReacted: false };
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  const currentUser = getCurrentUser();
  
  // Create filter for reactions
  const filter: Filter = {
    kinds: [NOSTR_KINDS.REACTION],
    '#e': [eventId]
  };
  
  // Generate cache key
  const cacheKey = generateCacheKey(filter) + '-reactions';
  
  // Check for cached results
  const cachedEvents = getCachedQueryResult(cacheKey);
  let events: Event[] = [];
  
  if (cachedEvents) {
    events = cachedEvents;
  } else {
    try {
      // First, get standard reactions (just e tag)
      const standardReactions = await pool.querySync(relays, filter);
      
      // Also look for reactions with the k=31985 tag (book review reactions)
      // or any other specialized reactions (with p tag)
      const specializedFilter: Filter = {
        kinds: [NOSTR_KINDS.REACTION],
        '#e': [eventId],
        // Note: We're not filtering by #k or #p here to catch all types
        // of specialized reactions in one query
      };
      
      const specializedReactions = await pool.querySync(relays, specializedFilter);
      
      // Combine reactions, removing duplicates
      const allReactions = [...standardReactions];
      const eventIds = new Set(standardReactions.map(e => e.id));
      
      specializedReactions.forEach(reaction => {
        if (!eventIds.has(reaction.id)) {
          allReactions.push(reaction);
          eventIds.add(reaction.id);
        }
      });
      
      events = allReactions;
      
      if (events.length > 0) {
        cacheQueryResult(cacheKey, events);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
      return { count: 0, userReacted: false };
    }
  }
  
  // Filter out events from blocked users
  const filteredEvents = filterBlockedEvents(events);
  if (filteredEvents.length !== events.length) {
    console.log(`Filtered out ${events.length - filteredEvents.length} reactions from blocked users`);
  }
  
  // Count unique pubkeys (one reaction per user)
  const uniquePubkeys = new Set(filteredEvents.map(event => event.pubkey));
  const userReacted = currentUser ? uniquePubkeys.has(currentUser.pubkey) : false;
  
  return {
    count: uniquePubkeys.size,
    userReacted
  };
}

/**
 * Batch fetch reactions for multiple events
 */
export async function batchFetchReactions(eventIds: string[]): Promise<Record<string, { count: number; userReacted: boolean }>> {
  if (!eventIds.length) {
    return {};
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  const currentUser = getCurrentUser();
  
  // Create filter for all reactions in one query
  const filter: Filter = {
    kinds: [NOSTR_KINDS.REACTION],
    '#e': eventIds
  };
  
  // Generate cache key
  const cacheKey = generateCacheKey(filter) + '-batch-reactions';
  
  // Check for cached results
  const cachedEvents = getCachedQueryResult(cacheKey);
  let events: Event[] = [];
  
  if (cachedEvents) {
    events = cachedEvents;
  } else {
    try {
      // First, get standard reactions (just e tag)
      const standardReactions = await pool.querySync(relays, filter);
      
      // Also look for reactions with specialized tags
      const specializedFilter: Filter = {
        kinds: [NOSTR_KINDS.REACTION],
        '#e': eventIds,
        // Note: We're not filtering by #k or #p here to catch all types
        // of specialized reactions in one query
      };
      
      const specializedReactions = await pool.querySync(relays, specializedFilter);
      
      // Combine reactions, removing duplicates
      const allReactions = [...standardReactions];
      const reactionIds = new Set(standardReactions.map(e => e.id));
      
      specializedReactions.forEach(reaction => {
        if (!reactionIds.has(reaction.id)) {
          allReactions.push(reaction);
          reactionIds.add(reaction.id);
        }
      });
      
      events = allReactions;
      
      if (events.length > 0) {
        cacheQueryResult(cacheKey, events);
      }
    } catch (error) {
      console.error("Error batch fetching reactions:", error);
      return {};
    }
  }
  
  // Filter out events from blocked users
  const filteredEvents = filterBlockedEvents(events);
  if (filteredEvents.length !== events.length) {
    console.log(`Filtered out ${events.length - filteredEvents.length} batch reactions from blocked users`);
  }
  
  // Group reactions by event ID
  const reactionsByEvent: Record<string, Set<string>> = {};
  
  for (const event of filteredEvents) {
    const eTag = event.tags.find(tag => tag[0] === 'e');
    if (!eTag || !eTag[1]) continue;
    
    const targetEventId = eTag[1];
    
    if (!reactionsByEvent[targetEventId]) {
      reactionsByEvent[targetEventId] = new Set();
    }
    
    reactionsByEvent[targetEventId].add(event.pubkey);
  }
  
  // Create result object with count and userReacted flag
  const result: Record<string, { count: number; userReacted: boolean }> = {};
  
  for (const eventId of eventIds) {
    const reactors = reactionsByEvent[eventId] || new Set();
    const userReacted = currentUser ? reactors.has(currentUser.pubkey) : false;
    
    result[eventId] = {
      count: reactors.size,
      userReacted
    };
  }
  
  return result;
}

/**
 * Format a reply event into a Reply object
 */
function formatReplyEvent(event: Event, authorName?: string, authorPicture?: string): Reply {
  return {
    id: event.id,
    content: event.content,
    pubkey: event.pubkey,
    createdAt: event.created_at * 1000,
    parentId: '', // Will be set when used
    author: {
      name: authorName || event.pubkey.slice(0, 8),
      picture: authorPicture,
      npub: event.pubkey
    }
  };
}

/**
 * Fetch replies (Kind 1 notes with e tag) for a specific event
 */
export async function fetchReplies(eventId: string): Promise<Reply[]> {
  return fetchRepliesForEvent(eventId);
}

/**
 * Fetch replies (Kind 1 notes with e tag) for a specific event
 */
export async function fetchRepliesForEvent(eventId: string): Promise<Reply[]> {
  if (!eventId) {
    return [];
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  // Create filter for replies
  const filter: Filter = {
    kinds: [NOSTR_KINDS.TEXT_NOTE],
    '#e': [eventId]
  };
  
  // Generate cache key
  const cacheKey = generateCacheKey(filter) + '-replies';
  
  // Check for cached results
  const cachedEvents = getCachedQueryResult(cacheKey);
  let events: Event[] = [];
  
  if (cachedEvents) {
    events = cachedEvents;
  } else {
    try {
      events = await pool.querySync(relays, filter);
      
      if (events.length > 0) {
        cacheQueryResult(cacheKey, events);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      return [];
    }
  }
  
  // Filter out events from blocked users
  const filteredEvents = filterBlockedEvents(events);
  if (filteredEvents.length !== events.length) {
    console.log(`Filtered out ${events.length - filteredEvents.length} replies from blocked users`);
  }
  
  // Get all unique pubkeys to fetch profiles
  const uniquePubkeys = [...new Set(filteredEvents.map(event => event.pubkey))];
  
  // Fetch profiles (simplified for now)
  const profileFilter: Filter = {
    kinds: [NOSTR_KINDS.SET_METADATA],
    authors: uniquePubkeys
  };
  
  let profileEvents: Event[] = [];
  
  try {
    profileEvents = await pool.querySync(relays, profileFilter);
  } catch (error) {
    console.error("Error fetching reply author profiles:", error);
  }
  
  // Create a map of pubkey to profile data
  const profileMap = new Map<string, { name?: string; picture?: string }>();
  
  for (const profileEvent of profileEvents) {
    try {
      const profileData = JSON.parse(profileEvent.content);
      profileMap.set(profileEvent.pubkey, {
        name: profileData.name || profileData.name,
        picture: profileData.picture
      });
    } catch (e) {
      console.error("Error parsing profile data:", e);
    }
  }
  
  // Format events into replies
  const replies: Reply[] = filteredEvents.map(event => {
    const profile = profileMap.get(event.pubkey);
    const reply = formatReplyEvent(event, profile?.name, profile?.picture);
    reply.parentId = eventId; // Set the parentId to the current eventId
    return reply;
  });
  
  // Sort by creation time, newest first
  return replies.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Batch fetch replies for multiple events
 */
export async function batchFetchReplies(eventIds: string[]): Promise<Record<string, Reply[]>> {
  if (!eventIds.length) {
    return {};
  }
  
  const relays = getUserRelays();
  const pool = getSharedPool();
  
  // Create filter for all replies in one query
  const filter: Filter = {
    kinds: [NOSTR_KINDS.TEXT_NOTE],
    '#e': eventIds
  };
  
  // Generate cache key
  const cacheKey = generateCacheKey(filter) + '-batch-replies';
  
  // Check for cached results
  const cachedEvents = getCachedQueryResult(cacheKey);
  let events: Event[] = [];
  
  if (cachedEvents) {
    events = cachedEvents;
  } else {
    try {
      events = await pool.querySync(relays, filter);
      
      if (events.length > 0) {
        cacheQueryResult(cacheKey, events);
      }
    } catch (error) {
      console.error("Error batch fetching replies:", error);
      return {};
    }
  }
  
  // Filter out events from blocked users
  const filteredEvents = filterBlockedEvents(events);
  if (filteredEvents.length !== events.length) {
    console.log(`Filtered out ${events.length - filteredEvents.length} batch replies from blocked users`);
  }
  
  // Get all unique pubkeys to fetch profiles
  const uniquePubkeys = [...new Set(filteredEvents.map(event => event.pubkey))];
  
  // Fetch profiles
  const profileFilter: Filter = {
    kinds: [NOSTR_KINDS.SET_METADATA],
    authors: uniquePubkeys
  };
  
  let profileEvents: Event[] = [];
  
  try {
    profileEvents = await pool.querySync(relays, profileFilter);
  } catch (error) {
    console.error("Error fetching reply author profiles:", error);
  }
  
  // Create a map of pubkey to profile data
  const profileMap = new Map<string, { name?: string; picture?: string }>();
  
  for (const profileEvent of profileEvents) {
    try {
      const profileData = JSON.parse(profileEvent.content);
      profileMap.set(profileEvent.pubkey, {
        name: profileData.name || profileData.name,
        picture: profileData.picture
      });
    } catch (e) {
      console.error("Error parsing profile data:", e);
    }
  }
  
  // Group replies by event ID
  const repliesByEvent: Record<string, Reply[]> = {};
  
  for (const event of filteredEvents) {
    const eTags = event.tags.filter(tag => tag[0] === 'e');
    if (!eTags.length) continue;
    
    // A reply might have multiple e tags, add to all referenced events
    for (const eTag of eTags) {
      const targetEventId = eTag[1];
      
      // Skip if this isn't one of our target events
      if (!eventIds.includes(targetEventId)) continue;
      
      if (!repliesByEvent[targetEventId]) {
        repliesByEvent[targetEventId] = [];
      }
      
      const profile = profileMap.get(event.pubkey);
      const reply = formatReplyEvent(event, profile?.name, profile?.picture);
      reply.parentId = targetEventId;
      
      repliesByEvent[targetEventId].push(reply);
    }
  }
  
  // Sort replies for each event by creation time
  for (const eventId of Object.keys(repliesByEvent)) {
    repliesByEvent[eventId].sort((a, b) => b.createdAt - a.createdAt);
  }
  
  // Ensure all requested event IDs have an entry
  for (const eventId of eventIds) {
    if (!repliesByEvent[eventId]) {
      repliesByEvent[eventId] = [];
    }
  }
  
  return repliesByEvent;
}
