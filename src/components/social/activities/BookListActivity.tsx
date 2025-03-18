
import React from "react";
import { Link } from "react-router-dom";
import { BookActionType } from "@/lib/nostr/types";

interface BookListActivityProps {
  userName: string;
  userPubkey: string;
  bookTitle: string;
  bookIsbn: string;
  type: BookActionType;
}

export function BookListActivity({ userName, userPubkey, bookTitle, bookIsbn, type }: BookListActivityProps) {
  const actionText = {
    'tbr': 'added',
    'reading': 'started reading',
    'finished': 'finished reading'
  }[type];

  const listText = type === 'tbr' ? ' to their TBR list' : '';

  return (
    <p>
      <Link to={`/user/${userPubkey}`} className="font-medium hover:underline">
        {userName}
      </Link>{' '}
      {actionText}{' '}
      <Link to={`/book/${bookIsbn}`} className="font-medium hover:underline">
        {bookTitle}
      </Link>{listText}
    </p>
  );
}
