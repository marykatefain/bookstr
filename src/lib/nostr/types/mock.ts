
import { Post } from './social';

export const mockPosts: Post[] = [
  {
    id: "post1",
    pubkey: "user1pubkey",
    content: "Just started this amazing book! The world-building is incredible so far.",
    createdAt: Date.now() - 3600000 * 24,
    author: {
      name: "Jane Reader",
      picture: "https://i.pravatar.cc/150?img=1",
      npub: "npub123"
    },
    taggedBook: {
      isbn: "978-0618260249",
      title: "The Lord of the Rings",
      coverUrl: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    id: "post2",
    pubkey: "user2pubkey",
    content: "I can't believe what just happened in chapter 15! The plot twist was unexpected!",
    createdAt: Date.now() - 3600000 * 12,
    author: {
      name: "Book Lover",
      picture: "https://i.pravatar.cc/150?img=2",
      npub: "npub456"
    },
    taggedBook: {
      isbn: "978-0141439518",
      title: "Pride and Prejudice",
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/71Q1tPupnVS._AC_UL600_SR600,600_.jpg"
    },
    isSpoiler: true
  },
  {
    id: "post3",
    pubkey: "user3pubkey",
    content: "Reading under the stars tonight ✨ This dystopian novel feels too real sometimes.",
    createdAt: Date.now() - 3600000 * 5,
    author: {
      name: "Night Reader",
      picture: "https://i.pravatar.cc/150?img=3",
      npub: "npub789"
    },
    taggedBook: {
      isbn: "978-0451524935",
      title: "1984",
      coverUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1686402559l/61439013.jpg"
    },
    mediaUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop",
    mediaType: "image"
  },
  {
    id: "post4",
    pubkey: "user4pubkey",
    content: "I'm finding this sci-fi comedy absolutely hilarious! 'DON'T PANIC' is solid life advice.",
    createdAt: Date.now() - 3600000 * 2,
    author: {
      name: "Galaxy Traveler",
      picture: "https://i.pravatar.cc/150?img=4",
      npub: "npub101"
    },
    taggedBook: {
      isbn: "978-0345391803",
      title: "The Hitchhiker's Guide to the Galaxy",
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/41tFB3jTGL._SX311_BO1,204,203,200_.jpg"
    }
  }
];
