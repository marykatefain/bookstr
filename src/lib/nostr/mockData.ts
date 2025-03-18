
import { SocialActivity } from "./types";
import { mockPosts } from "./types";

// Mock books data for activities
const mockActivityBooks = [
  {
    id: "book1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
    id: "book2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg"
  },
  {
    id: "book3",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
    id: "book4",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
    id: "book5",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  }
];

// Convert post to activity
const postActivities: SocialActivity[] = mockPosts.map(post => ({
  id: post.id,
  pubkey: post.pubkey,
  type: 'post',
  book: {
    id: post.taggedBook?.isbn || '',
    title: post.taggedBook?.title || '',
    author: '',
    isbn: post.taggedBook?.isbn || '',
    coverUrl: post.taggedBook?.coverUrl || '',
  },
  content: post.content,
  createdAt: post.createdAt,
  author: post.author,
  reactions: post.reactions,
  mediaUrl: post.mediaUrl,
  mediaType: post.mediaType,
  isSpoiler: post.isSpoiler
}));

export const mockFollowersActivities: SocialActivity[] = [
  {
    id: "activity1",
    pubkey: "user1pubkey",
    type: "reading",
    book: mockActivityBooks[0],
    createdAt: Date.now() - 3600000 * 2,
    author: {
      name: "Jane Reader",
      picture: "https://i.pravatar.cc/150?img=1",
      npub: "npub123"
    }
  },
  {
    id: "activity2",
    pubkey: "user2pubkey",
    type: "finished",
    book: mockActivityBooks[1],
    createdAt: Date.now() - 3600000 * 5,
    author: {
      name: "Book Lover",
      picture: "https://i.pravatar.cc/150?img=2",
      npub: "npub456"
    }
  },
  {
    id: "activity3",
    pubkey: "user3pubkey",
    type: "rating",
    book: mockActivityBooks[2],
    rating: 4,
    createdAt: Date.now() - 3600000 * 8,
    author: {
      name: "Night Reader",
      picture: "https://i.pravatar.cc/150?img=3",
      npub: "npub789"
    }
  },
  ...postActivities.slice(0, 2) // Add some post activities
];

export const mockGlobalActivities: SocialActivity[] = [
  ...mockFollowersActivities,
  {
    id: "activity4",
    pubkey: "user4pubkey",
    type: "tbr",
    book: mockActivityBooks[3],
    createdAt: Date.now() - 3600000 * 10,
    author: {
      name: "Galaxy Traveler",
      picture: "https://i.pravatar.cc/150?img=4",
      npub: "npub101"
    }
  },
  {
    id: "activity5",
    pubkey: "user5pubkey",
    type: "review",
    book: mockActivityBooks[4],
    content: "This book changed my perspective on society. I couldn't put it down and finished it in two days.",
    rating: 5,
    createdAt: Date.now() - 3600000 * 15,
    author: {
      name: "Literary Critic",
      picture: "https://i.pravatar.cc/150?img=5",
      npub: "npub202"
    }
  },
  ...postActivities.slice(2, 4) // Add more post activities
];
