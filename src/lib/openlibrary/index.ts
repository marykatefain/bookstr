
// Re-export all OpenLibrary API functionality
export * from './types';
export * from './utils';
export * from './genres';
export * from './trending';
export * from './bookDetails';
export { 
  searchBooks, 
  processBasicSearchResults,
  // Export the searchBooksByGenre from search.ts that supports the quickMode parameter
  searchBooksByGenre 
} from './search';

// We're no longer re-exporting searchBooksByGenre from genres since 
// we need the version from search.ts that supports the quickMode parameter
