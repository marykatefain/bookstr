
import { Reply } from './common';
import { Rating } from '@/lib/utils/Rating';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  description?: string;
  pubDate?: string;
  pageCount?: number;
  categories?: string[];
  readingStatus?: {
    status: 'tbr' | 'reading' | 'finished';
    dateAdded: number;
    rating?: Rating;
  };
  // Add author_name field for compatibility with OpenLibrary data
  author_name?: string[];
  // Add olKey field for OpenLibrary data
  olKey?: string;
}

export interface BookReview {
  id: string;
  pubkey: string;
  content?: string;
  rating?: Rating;
  createdAt: number;
  bookIsbn?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  replies?: Reply[];
  isSpoiler?: boolean;
}
