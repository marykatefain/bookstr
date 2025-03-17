
import { Book, NOSTR_KINDS } from "./types";
import { publishToNostr } from "./publish";

/**
 * Add a book to the "Want to Read" list
 */
export async function addBookToTBR(book: Book): Promise<string | null> {
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "tbr"],
      ["t", "books"],
      ["item", book.isbn, book.title, book.author]
    ],
    content: `Added ${book.title} by ${book.author} to my TBR list`
  };
  
  return publishToNostr(event);
}

/**
 * Mark a book as currently reading
 */
export async function markBookAsReading(book: Book): Promise<string | null> {
  const now = new Date().toISOString();
  
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags: [
      ["d", "reading"],
      ["t", "books"],
      ["item", book.isbn, book.title, book.author],
      ["started_at", now]
    ],
    content: `Started reading ${book.title} by ${book.author}`
  };
  
  return publishToNostr(event);
}

/**
 * Mark a book as read
 */
export async function markBookAsRead(book: Book, rating?: number): Promise<string | null> {
  const now = new Date().toISOString();
  
  const tags = [
    ["d", "read-books"],
    ["t", "books"],
    ["item", book.isbn, book.title, book.author],
    ["finished_at", now]
  ];
  
  // Add rating if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  const event = {
    kind: NOSTR_KINDS.GENERIC_LIST,
    tags,
    content: `Finished reading ${book.title} by ${book.author}${rating ? ` - Rating: ${rating}/5` : ''}`
  };
  
  return publishToNostr(event);
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
      ["subject", book.isbn, book.title, book.author],
      ["r", rating.toString()],
      ["context", "bookverse"]
    ],
    content: `${rating} Stars${rating < 3 ? " - Could be better" : rating < 5 ? " - Pretty good" : " - Amazing!"}`
  };
  
  return publishToNostr(event);
}

/**
 * Post a review for a book
 */
export async function reviewBook(book: Book, reviewText: string, rating?: number): Promise<string | null> {
  const tags = [
    ["t", "book-review"],
    ["book", book.isbn, book.title, book.author]
  ];
  
  // Add rating tag if provided
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    tags.push(["rating", rating.toString()]);
  }
  
  // For longer reviews, use Long Form Content kind
  const useNIP23 = reviewText.length > 280;
  
  const event = {
    kind: useNIP23 ? NOSTR_KINDS.LONG_FORM : NOSTR_KINDS.TEXT_NOTE,
    tags,
    content: useNIP23 
      ? JSON.stringify({
          title: `Review: ${book.title}`,
          published_at: Math.floor(Date.now() / 1000),
          content: reviewText
        })
      : reviewText
  };
  
  return publishToNostr(event);
}
