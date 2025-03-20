
import { Reply } from './common';

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
  author_name?: string[]; // Add author_name array from OpenLibrary
  readingStatus?: {
    status: 'tbr' | 'reading' | 'finished';
    dateAdded: number;
    rating?: number;
  };
}

export interface BookReview {
  id: string;
  pubkey: string;
  content: string;
  rating?: number;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  bookIsbn?: string;
  bookTitle?: string;
  bookCover?: string;
  bookAuthor?: string;
  replies?: Reply[]; // Add replies property
}
