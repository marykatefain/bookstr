
import { Book, NOSTR_KINDS } from "./types";
import { publishToNostr } from "./publish";

/**
 * Publish book metadata according to NIP-73
 */
export async function publishBookMetadata(book: Book): Promise<string | null> {
  const event = {
    kind: NOSTR_KINDS.BOOK_METADATA,
    tags: [
      ["d", `isbn:${book.isbn}`],
      ["t", "book"],
      ["name", book.title],
      ["author", book.author],
      // Include other metadata tags if available
      ...(book.pageCount ? [["pages", book.pageCount.toString()]] : []),
      ...(book.pubDate ? [["published", book.pubDate]] : []),
      ...(book.categories?.length ? book.categories.map(cat => ["category", cat]) : [])
    ],
    content: book.description || `Metadata for ${book.title} by ${book.author}`
  };
  
  return publishToNostr(event);
}

/**
 * Add a book to the "TBR" list (formerly "Want to Read")
 */
export async function addBookToTBR(book: Book): Promise<string | null> {
  console.log("==== Adding book to TBR ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  // Create a direct Kind 30000 list event
  const now = new Date();
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "tbr"],
      ["t", "books"],
      ["title", book.title],
      ["author", book.author],
      ["i", `isbn:${book.isbn}`],
      ["added_at", now.toISOString()]
    ],
    content: `Added "${book.title}" by ${book.author} to my TBR list`
  };
  
  console.log("Publishing TBR event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("TBR publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in addBookToTBR:", error);
    throw error;
  }
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(book: Book): Promise<string | null> {
  console.log("==== Marking book as reading ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  const now = new Date().toISOString();
  
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "reading"],
      ["t", "books"],
      ["i", `isbn:${book.isbn}`],
      ["title", book.title],
      ["author", book.author],
      ["started_at", now]
    ],
    content: `Started reading "${book.title}" by ${book.author}`
  };
  
  console.log("Publishing reading event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("Reading publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in markBookAsReading:", error);
    throw error;
  }
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: Book, rating?: number): Promise<string | null> {
  console.log("==== Marking book as read ====");
  console.log("Book details:", book.title, book.author, book.isbn);
  
  const now = new Date().toISOString();
  
  const tags = [
    ["d", "read"],
    ["t", "books"],
    ["i", `isbn:${book.isbn}`],
    ["title", book.title],
    ["author", book.author],
    ["finished_at", now]
  ];
  
  // Add rating if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags,
    content: `Finished reading "${book.title}" by ${book.author}${rating ? ` - Rating: ${rating}/5` : ''}`
  };
  
  console.log("Publishing read event with tags:", event.tags);
  console.log("Event kind:", event.kind);
  
  try {
    const result = await publishToNostr(event);
    console.log("Read publish result:", result);
    return result;
  } catch (error) {
    console.error("Error in markBookAsRead:", error);
    throw error;
  }
}

/**
 * Rate a book separately (using the proposed NIP for ratings)
 */
export async function rateBook(book: Book, rating: number): Promise<string | null> {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  
  // Using the proposed NIP format for ratings
  const event = {
    kind: NOSTR_KINDS.BOOK_RATING,
    tags: [
      ["d", `rating:${book.isbn}`],
      ["t", "book-rating"],
      ["i", `isbn:${book.isbn}`], // NIP-73 compliant ISBN reference
      ["title", book.title],
      ["author", book.author],
      ["r", rating.toString()],
      ["context", "bookverse"]
    ],
    content: `${rating} Stars${rating < 3 ? " - Could be better" : rating < 5 ? " - Pretty good" : " - Amazing!"}`
  };
  
  return publishToNostr(event);
}

/**
 * Post a review for a book (using NIP-22 for long-form content)
 */
export async function reviewBook(book: Book, reviewText: string, rating?: number): Promise<string | null> {
  const tags = [
    ["t", "book-review"],
    ["i", `isbn:${book.isbn}`], // NIP-73 compliant ISBN reference
    ["title", book.title],
    ["author", book.author]
  ];
  
  // Add rating tag if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  // Use NIP-22 (Kind 1111) for reviews instead of regular notes or long-form content
  const event = {
    kind: NOSTR_KINDS.REVIEW,
    tags,
    content: reviewText
  };
  
  return publishToNostr(event);
}
