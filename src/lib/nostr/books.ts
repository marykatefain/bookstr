
// This file now acts as a facade for the book services

import { Book, BookActionType, Reply } from "./types";
import { BookListService } from "./services/BookLists";
import { BookReviewService } from "./services/BookReviews";
import { SocialInteractionService } from "./services/SocialInteractions";

// Re-export list management functions
export const addBookToTBR = BookListService.addBookToTBR.bind(BookListService);
export const markBookAsReading = BookListService.markBookAsReading.bind(BookListService);
export const markBookAsRead = BookListService.markBookAsRead.bind(BookListService);
export const updateBookInList = BookListService.updateBookInList.bind(BookListService);
export const removeBookFromList = BookListService.removeBookFromList.bind(BookListService);
export const addBookToList = BookListService.addBookToList.bind(BookListService);

// Re-export review and rating functions
export const rateBook = BookReviewService.rateBook.bind(BookReviewService);
export const reviewBook = BookReviewService.reviewBook.bind(BookReviewService);

// Re-export social interaction functions
export const reactToContent = SocialInteractionService.reactToContent.bind(SocialInteractionService);
export const replyToContent = SocialInteractionService.replyToContent.bind(SocialInteractionService);
export const fetchEventById = SocialInteractionService.fetchEventById.bind(SocialInteractionService);
export const fetchReactions = SocialInteractionService.fetchReactions.bind(SocialInteractionService);
export const fetchReplies = SocialInteractionService.fetchReplies.bind(SocialInteractionService);
export const followUser = SocialInteractionService.followUser.bind(SocialInteractionService);
