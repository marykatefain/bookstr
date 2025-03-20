
import { useCallback, useState } from "react";
import { Post, SocialActivity } from "@/lib/nostr/types";
import { fetchUserPosts } from "@/lib/nostr/posts";
import { getCurrentUser, fetchUserBooks, fetchUserReviews } from "@/lib/nostr";
import { NOSTR_KINDS } from "@/lib/nostr/types/constants";
import { enrichActivitiesWithData } from "@/lib/nostr/utils/feedUtils";

export function useUserPosts(limit: number = 10) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.pubkey) {
        setActivities([]);
        return;
      }

      // Fetch all types of user content in parallel
      const [userPosts, userBooks, userReviews] = await Promise.all([
        fetchUserPosts(currentUser.pubkey, false),
        fetchUserBooks(currentUser.pubkey),
        fetchUserReviews(currentUser.pubkey)
      ]);

      // Transform posts to activities
      const postActivities: SocialActivity[] = userPosts.map(post => ({
        id: post.id,
        pubkey: post.pubkey,
        type: 'post',
        content: post.content,
        createdAt: post.createdAt,
        author: post.author,
        book: post.taggedBook || {
          id: '',
          title: '',
          author: '',
          isbn: '',
          coverUrl: ''
        },
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        reactions: post.reactions,
        replies: post.replies,
        isSpoiler: post.isSpoiler
      }));

      // Transform book activities (tbr, reading, finished)
      const bookActivities: SocialActivity[] = userBooks.flatMap(book => {
        if (!book.readingStatus) return [];
        
        const status = book.readingStatus.status;
        return {
          id: `${book.id}-${status}-${book.readingStatus.dateAdded}`,
          pubkey: currentUser.pubkey,
          type: status,
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            coverUrl: book.coverUrl
          },
          createdAt: book.readingStatus.dateAdded,
          author: {
            name: currentUser.name,
            picture: currentUser.picture,
            npub: currentUser.npub
          }
        };
      });

      // Transform review activities
      const reviewActivities: SocialActivity[] = userReviews.map(review => ({
        id: review.id,
        pubkey: review.pubkey,
        type: 'review',
        content: review.content,
        rating: review.rating,
        book: {
          id: review.bookIsbn || '',
          title: review.bookTitle || '',
          author: review.bookAuthor || '',
          isbn: review.bookIsbn || '',
          coverUrl: review.bookCover || ''
        },
        createdAt: review.createdAt,
        author: review.author,
        replies: review.replies
      }));

      // Combine all activities
      const allActivities = [...postActivities, ...bookActivities, ...reviewActivities];
      
      // Sort by createdAt in descending order (newest first)
      allActivities.sort((a, b) => b.createdAt - a.createdAt);
      
      // Apply limit if needed
      const limitedActivities = limit > 0 ? allActivities.slice(0, limit) : allActivities;
      
      // Enrich activities with reactions and replies if not already present
      const enrichedActivities = await enrichActivitiesWithData(limitedActivities);
      
      setActivities(enrichedActivities);
    } catch (err) {
      console.error("Error fetching user activities:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch activities"));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return {
    activities,
    loading,
    error,
    fetchPosts
  };
}
