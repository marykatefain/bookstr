
import { Book } from './books';

export interface Reply {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  parentId: string;
}

export interface Post {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  taggedBook?: {
    isbn: string;
    title: string;
    coverUrl: string;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isSpoiler?: boolean;
  reactions?: {
    count: number;
    userReacted: boolean;
  };
  replies?: Reply[];
}

export interface SocialActivity {
  id: string;
  pubkey: string;
  type: 'review' | 'rating' | 'tbr' | 'reading' | 'finished' | 'post';
  book: Book;
  content?: string;
  rating?: number;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  reactions?: {
    count: number;
    userReacted: boolean;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isSpoiler?: boolean;
  replies?: Reply[];
}
