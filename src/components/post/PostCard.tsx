
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Post, SocialActivity } from "@/lib/nostr/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCover } from "@/components/book/BookCover";
import { formatPubkey } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reactToContent } from "@/lib/nostr";
import { RepliesSection } from "@/components/social/RepliesSection";

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
        taggedBook: post.book.isbn ? {
          isbn: post.book.isbn,
          title: post.book.title,
          coverUrl: post.book.coverUrl
        } : undefined,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        isSpoiler: post.isSpoiler,
        reactions: post.reactions,
        replies: post.replies
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

  // Function to detect URLs in text content
  const detectAndRenderMediaUrls = (content: string) => {
    // Simple URL regex - can be improved for more accurate detection
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|mov|webm))/gi;
    const urlMatches = content.match(urlRegex);
    
    if (!urlMatches) return null;
    
    return urlMatches.map((url, index) => {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const isVideo = /\.(mp4|mov|webm)$/i.test(url);
      
      if (isImage) {
        return (
          <div key={index} className="mt-3">
            <img 
              src={url} 
              alt="Media from post content" 
              className="rounded-md max-h-80 object-contain mx-auto" 
              onError={(e) => {
                console.log(`Error loading embedded media: ${url}`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      } else if (isVideo) {
        return (
          <div key={index} className="mt-3">
            <video 
              src={url} 
              controls 
              className="rounded-md w-full max-h-80" 
              onError={(e) => {
                console.log(`Error loading embedded video: ${url}`);
                (e.target as HTMLVideoElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      
      return null;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to={`/user/${postData.pubkey}`}>
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
                <AvatarImage src={postData.author?.picture} />
                <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
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
            <p className="whitespace-pre-wrap break-words overflow-hidden">{postData.content}</p>
            
            {/* Render specifically tagged media from post.mediaUrl if it exists */}
            {postData.mediaUrl && (
              <div className="mt-3">
                {postData.mediaType === 'image' ? (
                  <img 
                    src={postData.mediaUrl} 
                    alt="Post media" 
                    className="rounded-md max-h-80 mx-auto object-contain" 
                    onError={(e) => {
                      console.log(`Error loading media: ${postData.mediaUrl}`);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : postData.mediaType === 'video' ? (
                  <video 
                    src={postData.mediaUrl} 
                    controls 
                    className="rounded-md w-full max-h-80" 
                    onError={(e) => {
                      console.log(`Error loading video: ${postData.mediaUrl}`);
                      (e.target as HTMLVideoElement).style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
            )}
            
            {/* Detect and render media URLs from content text */}
            {detectAndRenderMediaUrls(postData.content)}
            
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
      
      <CardFooter className="pt-0 py-2 flex-col items-start">
        <RepliesSection 
          eventId={postData.id}
          authorPubkey={postData.pubkey}
          initialReplies={postData.replies}
          buttonLayout="horizontal"
          onReaction={handleReaction}
          reactionCount={postData.reactions?.count}
          userReacted={postData.reactions?.userReacted}
        />
      </CardFooter>
    </Card>
  );
}
