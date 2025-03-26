// Add BASE_URL export to types.ts (if it doesn't already exist)
import { API_BASE_URL } from './utils';

export { API_BASE_URL };

export interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: Array<any>;
  num_found: number;
  q: string;
  offset: number | null;
}

// Base URL for the OpenLibrary API
export const BASE_URL = "https://openlibrary.org";
