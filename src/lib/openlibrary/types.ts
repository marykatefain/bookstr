
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
  isbn?: string[];
  cover_i?: number;
  publish_date?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  first_publish_year?: number;
  description?: string;
}
