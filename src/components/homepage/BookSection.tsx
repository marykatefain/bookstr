
import React from "react";
import { Link } from "react-router-dom";
import { BookCard } from "@/components/BookCard";
import { Loader2 } from "lucide-react";
import { Book } from "@/lib/nostr/types";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";

interface BookSectionProps {
  title: string;
  books: Book[];
  loading: boolean;
  onUpdate: () => void;
  useCarousel?: boolean;
  totalBooks?: number;
}

export function BookSection({ 
  title, 
  books, 
  loading, 
  onUpdate, 
  useCarousel = false,
  totalBooks = 3
}: BookSectionProps) {
  const renderLoadingCard = () => (
    <div className="overflow-hidden h-full book-card">
      <div className="p-0">
        <div className="relative aspect-[2/3] bg-gray-200 animate-pulse"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          <div className="flex items-center space-x-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="pt-2 flex space-x-2">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      if (useCarousel) {
        return (
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {[1, 2, 3].map((_, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/3">
                  {renderLoadingCard()}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        );
      }
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderLoadingCard()}
          {renderLoadingCard()}
          {renderLoadingCard()}
        </div>
      );
    }

    if (useCarousel) {
      return (
        <Carousel className="w-full relative">
          <CarouselContent className="-ml-4">
            {books.map(book => (
              <CarouselItem key={book.id} className="pl-4 md:basis-1/3 lg:basis-1/4">
                <BookCard 
                  key={book.id} 
                  book={book}
                  showDescription={false}
                  size="medium"
                  onUpdate={() => onUpdate()}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute -left-4 top-1/2 -translate-y-1/2">
            <CarouselPrevious className="h-8 w-8 rounded-full opacity-70 hover:opacity-100" />
          </div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2">
            <CarouselNext className="h-8 w-8 rounded-full opacity-70 hover:opacity-100" />
          </div>
        </Carousel>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map(book => (
          <BookCard 
            key={book.id} 
            book={book}
            showDescription={false}
            size="medium"
            onUpdate={() => onUpdate()}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-bookverse-ink">{title}</h2>
            <Link to="/books" className="text-sm text-bookverse-accent hover:underline">
              View All
            </Link>
          </div>
          {renderContent()}
        </div>
      </div>
    </section>
  );
}
