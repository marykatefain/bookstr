
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const BookNotFound: React.FC = () => {
  return (
    <div className="container px-4 py-8 text-center">
      <h1 className="text-2xl font-bold">Book Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn't find the book you're looking for.
      </p>
      <Link to="/books">
        <Button className="mt-4">Browse Books</Button>
      </Link>
    </div>
  );
};
