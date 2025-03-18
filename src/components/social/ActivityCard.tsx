import React from "react";
import { Link } from "react-router-dom";
import { Book, MessageCircle, Heart, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialActivity } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { nip19 } from "nostr-tools";
import { reactToContent, isLoggedIn } from "@/lib/nostr";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityCardProps {
  activity: SocialActivity;
  onReaction: (activityId: string) => void;
}

export function ActivityCard({ activity, onReaction }: ActivityCardProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const formatPubkey = (pubkey: string): string => {
    try {
      const npub = nip19.npubEncode(pubkey);
      return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
    } catch {
      return `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;
    }
  };

  const renderActivityContent = () => {
    const userName = activity.author?.name || formatPubkey(activity.pubkey);
    const bookTitle = activity.book.title;
    
    switch (activity.type) {
      case 'tbr':
        return (
          <p>
            <Link to={`/user/${activity.pubkey}`} className="font-medium hover:underline">
              {userName}
            </Link>{' '}
            added{' '}
            <Link to={`/book/${activity.book.isbn}`} className="font-medium hover:underline">
              {bookTitle}
            </Link>{' '}
            to their TBR list
          </p>
        );
      case 'reading':
        return (
          <p>
            <Link to={`/user/${activity.pubkey}`} className="font-medium hover:underline">
              {userName}
            </Link>{' '}
            started reading{' '}
            <Link to={`/book/${activity.book.isbn}`} className="font-medium hover:underline">
              {bookTitle}
            </Link>
          </p>
        );
      case 'finished':
        return (
          <p>
            <Link to={`/user/${activity.pubkey}`} className="font-medium hover:underline">
              {userName}
            </Link>{' '}
            finished reading{' '}
            <Link to={`/book/${activity.book.isbn}`} className="font-medium hover:underline">
              {bookTitle}
            </Link>
          </p>
        );
      case 'rating':
        return (
          <div>
            <p>
              <Link to={`/user/${activity.pubkey}`} className="font-medium hover:underline">
                {userName}
              </Link>{' '}
              rated{' '}
              <Link to={`/book/${activity.book.isbn}`} className="font-medium hover:underline">
                {bookTitle}
              </Link>
            </p>
            {activity.rating && (
              <div className="flex items-center mt-1">
                {Array(5).fill(0).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${index < activity.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'review':
        return (
          <div>
            <p>
              <Link to={`/user/${activity.pubkey}`} className="font-medium hover:underline">
                {userName}
              </Link>{' '}
              reviewed{' '}
              <Link to={`/book/${activity.book.isbn}`} className="font-medium hover:underline">
                {bookTitle}
              </Link>
            </p>
            {activity.rating && (
              <div className="flex items-center mt-1">
                {Array(5).fill(0).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${index < activity.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}
            {activity.content && (
              <p className="mt-2 text-sm text-muted-foreground">
                {activity.content.length > 150 
                  ? `${activity.content.substring(0, 150)}...` 
                  : activity.content}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const handleReplyClick = () => {
    toast({
      title: "Coming soon",
      description: "Reply functionality will be available soon"
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.author?.picture} />
            <AvatarFallback>{activity.author?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link 
              to={`/user/${activity.pubkey}`} 
              className="font-medium text-sm hover:underline"
            >
              {activity.author?.name || formatPubkey(activity.pubkey)}
            </Link>
            <time className="text-xs text-muted-foreground">
              {new Date(activity.createdAt).toLocaleDateString()}
            </time>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex gap-4">
          <Link to={`/book/${activity.book.isbn}`} className="shrink-0">
            <div className="w-16 h-24 rounded overflow-hidden shadow-sm">
              <img 
                src={activity.book.coverUrl} 
                alt={activity.book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          </Link>
          <div className="flex-1">
            {renderActivityContent()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={() => onReaction(activity.id)}
        >
          <Heart className={`mr-1 h-4 w-4 ${activity.reactions?.userReacted ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{activity.reactions?.count ? activity.reactions.count : 'Like'}</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={handleReplyClick}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          <span>Reply</span>
        </Button>
        {!isMobile && (
          <Link to={`/book/${activity.book.isbn}`} className="ml-auto">
            <Button variant="ghost" size="sm">
              <Book className="mr-1 h-4 w-4" />
              <span>View Book</span>
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
