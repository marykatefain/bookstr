
// Re-export all OpenLibrary API functionality
export * from './types';
export * from './utils';
export * from './genres';
export * from './trending';
export * from './bookDetails';
export { 
  searchBooks, 
  searchBooksByGenre as searchBooksByGenreFromSearch, 
  processBasicSearchResults 
} from './search';

// Re-export searchBooksByGenre from genres as the default implementation
export { searchBooksByGenre } from './genres';
