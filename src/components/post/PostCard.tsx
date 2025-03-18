import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Post, SocialActivity } from "@/lib/nostr/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCover } from "@/components/book/BookCover";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Book, AlertTriangle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reactToContent } from "@/lib/nostr";

interface PostCardProps {
  post: Post | SocialActivity;
  onReaction?: (postId: string) => void;
}

export function PostCard({ post, onReaction }: PostCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const { toast } = useToast();
  
  const isSocialActivity = 'type' in post && post.type === 'post';
  const postData = isSocialActivity 
    ? {
        id: post.id,
        content: post.content || "",
        pubkey: post.pubkey,
        author: post.author,
        createdAt: post.createdAt,
        taggedBook: {
          isbn: post.book.isbn,
          title: post.book.title,
          coverUrl: post.book.coverUrl
        },
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        isSpoiler: post.isSpoiler,
        reactions: post.reactions
      }
    : post as Post;
  
  const authorName = postData.author?.name || formatPubkey(postData.pubkey);
  const timeAgo = formatDistanceToNow(new Date(postData.createdAt), { addSuffix: true });
  
  const handleRevealSpoiler = () => {
    setSpoilerRevealed(true);
  };
  
  const handleReaction = async () => {
    if (onReaction) {
      onReaction(postData.id);
    } else {
      try {
        await reactToContent(postData.id);
        toast({
          title: "Reaction sent",
          description: "You've reacted to this post"
        });
      } catch (error) {
        console.error("Error reacting to post:", error);
        toast({
          title: "Error",
          description: "Could not send reaction",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={postData.author?.picture} />
              <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Link 
                to={`/user/${postData.pubkey}`} 
                className="font-medium hover:underline"
              >
                {authorName}
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          
          {postData.isSpoiler && (
            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-100 px-2 py-1 rounded-full text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Spoiler</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        {postData.isSpoiler && !spoilerRevealed ? (
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-muted-foreground mb-2">This post contains spoilers</p>
            <Button variant="outline" size="sm" onClick={handleRevealSpoiler}>
              <Eye className="mr-1 h-4 w-4" />
              <span>Reveal Content</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap">{postData.content}</p>
            
            {postData.mediaUrl && (
              <div className="mt-3">
                {postData.mediaType === 'image' ? (
                  <img 
                    src={postData.mediaUrl} 
                    alt="Post media" 
                    className="rounded-md max-h-80 mx-auto object-contain" 
                  />
                ) : postData.mediaType === 'video' ? (
                  <video 
                    src={postData.mediaUrl} 
                    controls 
                    className="rounded-md w-full max-h-80" 
                  />
                ) : null}
              </div>
            )}
            
            {postData.taggedBook && (
              <Link to={`/book/${postData.taggedBook.isbn}`} className="block">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-md mt-3 hover:bg-muted/80 transition-colors">
                  <div className="flex-shrink-0 w-12 h-16">
                    <BookCover 
                      coverUrl={postData.taggedBook.coverUrl} 
                      title={postData.taggedBook.title} 
                      size="xsmall" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{postData.taggedBook.title}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 py-2">
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={handleReaction}
          >
            <Heart className={`mr-1 h-4 w-4 ${postData.reactions?.userReacted ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{postData.reactions?.count || 'Like'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            <span>Reply</span>
          </Button>
          
          {postData.taggedBook && (
            <Link to={`/book/${postData.taggedBook.isbn}`} className="ml-auto">
              <Button variant="ghost" size="sm">
                <Book className="mr-1 h-4 w-4" />
                <span>View Book</span>
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
