
import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface BookRatingActivityProps {
  userName: string;
  userPubkey: string;
  bookTitle: string;
  bookIsbn: string;
  rating?: number;
}

export function BookRatingActivity({ userName, userPubkey, bookTitle, bookIsbn, rating }: BookRatingActivityProps) {
  return (
    <div>
      <p>
        <Link to={`/user/${userPubkey}`} className="font-medium hover:underline">
          {userName}
        </Link>{' '}
        rated{' '}
        <Link to={`/book/${bookIsbn}`} className="font-medium hover:underline">
          {bookTitle}
        </Link>
      </p>
      {rating && (
        <div className="flex items-center mt-1">
          {Array(5).fill(0).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
