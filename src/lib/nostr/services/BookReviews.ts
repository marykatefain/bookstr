
import { Book } from "../types";
import { NOSTR_KINDS } from "../types";
import { publishToNostr } from "../publish";

/**
 * Service for handling book reviews and ratings
 */
export class BookReviewService {
  /**
   * Rate a book separately
   */
  static async rateBook(book: Book, rating: number): Promise<string | null> {
    if (!book.isbn) {
      console.error("Cannot rate book: ISBN is missing");
      return null;
    }
    
    // Convert rating from 1-5 scale to 0-1 scale if needed
    let normalizedRating = rating;
    if (rating > 1 && rating <= 5) {
      normalizedRating = rating / 5;
    }
    
    // Ensure rating is between 0 and 1
    if (normalizedRating < 0 || normalizedRating > 1) {
      console.error("Rating must be between 0 and 1 (or 1-5 if being converted)");
      return null;
    }
    
    console.log(`Publishing rating for ${book.title}: ${normalizedRating} (original: ${rating})`);
    
    const event = {
      kind: NOSTR_KINDS.REVIEW,
      tags: [
        ["d", `isbn:${book.isbn}`],
        ["k", "isbn"],
        ["rating", normalizedRating.toString()]
      ],
      content: ""
    };
    
    return publishToNostr(event);
  }
  
  /**
   * Post a review for a book
   */
  static async reviewBook(book: Book, reviewText: string, rating?: number): Promise<string | null> {
    if (!book.isbn) {
      console.error("Cannot review book: ISBN is missing");
      return null;
    }
    
    // Create tags array with the required format
    const tags = [
      ["d", `isbn:${book.isbn}`],
      ["k", "isbn"]
    ];
    
    // Add rating tag if provided, convert from 1-5 scale to 0-1 scale
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      const normalizedRating = (rating / 5).toFixed(2);
      tags.push(["rating", normalizedRating]);
    }
    
    const event = {
      kind: NOSTR_KINDS.REVIEW,
      tags,
      content: reviewText
    };
    
    console.log("Publishing review event:", event);
    return publishToNostr(event);
  }
}
