
import { Book } from "@/lib/nostr/types";

export const BASE_URL = "https://openlibrary.org";

export interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  isbn?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  edition_key?: string[]; // Added this property
  publish_date?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
  language?: string[];
  description?: string;
  edition_count?: number;
  has_fulltext?: boolean;
  ia?: string[];
  subtitle?: string;
  
  // New fields for improved ISBN extraction
  lending_identifier_s?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  identifiers?: {
    isbn_10?: string[];
    isbn_13?: string[];
    [key: string]: string[] | undefined;
  };
  
  // Add editions field for ISBN extraction from editions
  editions?: {
    isbn?: string[];
    [key: string]: any;
  };
}

