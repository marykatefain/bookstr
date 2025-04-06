import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/nostr";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageSquare, Repeat } from "lucide-react";
import { fetchNotifications } from "@/lib/nostr/fetch/notifications";
import { useToast } from "@/components/ui/use-toast";

const NotificationsFeed = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    
    loadUser();
  }, []);
  
  const {
    data: notifications,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["notifications", user?.pubkey],
    queryFn: () => fetchNotifications(user?.pubkey),
    enabled: !!user?.pubkey,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getNotificationIcon = (kind: number) => {
    switch (kind) {
      case 7: // Reaction
        return <Heart className="h-5 w-5 text-red-500" />;
      case 1: // Reply to post
      case 1111: // Reply to review
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Repeat className="h-5 w-5 text-green-500" />;
    }
  };

  const getNotificationText = (notification: any) => {
    const { kind, content, author } = notification;
    const authorName = author?.name || author?.nip05 || 'Someone';
    
    switch (kind) {
      case 7: // Reaction
        return (
          <>
            {content === "+" ? "❤️" : content} {authorName} reacted to your post
          </>
        );
      case 1: // Reply to post
        return `${authorName} replied to your post`;
      case 1111: // Reply to a review
        return `${authorName} commented on your review`;
      default:
        return `${authorName} mentioned you`;
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Your notifications have been updated"
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500 mb-2">Failed to load notifications</p>
        <button 
          onClick={handleRefresh}
          className="text-sm text-bookverse-accent hover:text-bookverse-highlight"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!notifications?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-2">No notifications yet</p>
        <p className="text-sm">
          When someone reacts to your posts or reviews, or mentions you, you'll see it here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Notifications</h3>
        <button 
          onClick={handleRefresh}
          className="text-sm text-bookverse-accent hover:text-bookverse-highlight"
        >
          Refresh
        </button>
      </div>
      
      {notifications.map((notification: any) => (
        <Card key={notification.id} className="p-4 hover:bg-bookverse-cream/50 transition-colors">
          <Link to={notification.link || "#"} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {notification.author?.picture ? (
                <img 
                  src={notification.author.picture} 
                  alt={notification.author?.name || "User"} 
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 bg-bookverse-accent/20 rounded-full flex items-center justify-center">
                  {getNotificationIcon(notification.kind)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm">{getNotificationText(notification)}</p>
              {notification.content && notification.kind !== 7 && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.content}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.created_at * 1000), { addSuffix: true })}
              </p>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsFeed;