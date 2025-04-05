import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { fetchEventById, reactToContent, fetchUserProfile } from "@/lib/nostr";
import { NOSTR_KINDS, Post } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, ArrowLeft, BookOpen, Eye, Image, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchReplies } from "@/lib/nostr";
import { RepliesSection } from "@/components/social/RepliesSection";
import { Skeleton } from "@/components/ui/skeleton";
import { extractMediaUrls, isMediaUrl, linkifyText } from "@/lib/utils/urlUtils";
import { formatPubkey } from "@/lib/utils/format";
import { BookCover } from "@/components/book/BookCover";
import { getBookByISBN } from "@/lib/openlibrary";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageViewerModal } from "@/components/post/ImageViewerModal";

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("No post ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const event = await fetchEventById(postId);
        
        if (!event) {
          setError("Post not found");
          setLoading(false);
          return;
        }
        
        // Check if this is a text note (kind 1)
        if (event.kind !== NOSTR_KINDS.TEXT_NOTE) {
          setError("This is not a post");
          setLoading(false);
          return;
        }

        // Extract book ISBN if present
        let taggedBook = null;
        const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
        if (isbnTag) {
          const isbn = isbnTag[1].replace('isbn:', '');
          const bookDetails = await getBookByISBN(isbn);
          if (bookDetails) {
            taggedBook = {
              isbn,
              title: bookDetails.title,
              coverUrl: bookDetails.coverUrl
            };
          }
        }
        
        // Check for media
        const mediaTag = event.tags.find(tag => tag[0] === 'media');
        const mediaUrl = mediaTag ? mediaTag[2] : undefined;
        const mediaType = mediaTag ? (mediaTag[1] as "image" | "video") : undefined;
        
        // Check for spoiler/content-warning tag
        const contentWarningTag = event.tags.find(tag => tag[0] === 'content-warning');
        const spoilerTag = event.tags.find(tag => tag[0] === 'spoiler');
        const isSpoiler = !!contentWarningTag || (!!spoilerTag && spoilerTag[1] === "true");
        
        // Fetch replies
        const replies = await fetchReplies(event.id);
        
        // Fetch author profile
        const authorProfile = await fetchUserProfile(event.pubkey);
        
        const postData: Post = {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          createdAt: event.created_at * 1000,
          taggedBook,
          mediaUrl,
          mediaType,
          isSpoiler,
          author: authorProfile ? {
            name: authorProfile.name || formatPubkey(event.pubkey),
            picture: authorProfile.picture,
            npub: event.pubkey
          } : undefined,
          replies
        };
        
        setPost(postData);
      } catch (error) {
        console.error("Error loading post:", error);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [postId]);

  const handleReaction = async () => {
    if (!post) return;
    
    try {
      await reactToContent(post.id);
      toast({
        title: "Reaction sent",
        description: "Your reaction has been published"
      });
    } catch (error) {
      console.error("Error sending reaction:", error);
      toast({
        title: "Error",
        description: "Failed to send reaction",
        variant: "destructive"
      });
    }
  };

  const handleImageError = (url: string) => {
    console.log(`Error loading image: ${url}`);
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  const openImageViewer = (images: string[], initialIndex: number) => {
    setViewerImages(images);
    setCurrentImageIndex(initialIndex);
    setImageViewerOpen(true);
  };

  const detectAndRenderMediaUrls = (content: string) => {
    if (!content) return null;
    
    const mediaUrls = extractMediaUrls(content)
      .filter(url => !imageErrors[url]);
    
    if (mediaUrls.length === 0) return null;
    
    const imageUrls = mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
    const videoUrls = mediaUrls.filter(url => /\.(mp4|mov|webm)$/i.test(url));
    
    const displayImageUrls = showAllMedia ? imageUrls : imageUrls.slice(0, 4);
    const hasMoreImages = imageUrls.length > 4 && !showAllMedia;
    
    return (
      <div className="mt-3 space-y-3">
        {displayImageUrls.length > 0 && (
          <div className={`grid gap-2 ${
            displayImageUrls.length === 1 ? 'grid-cols-1' : 
            displayImageUrls.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 md:grid-cols-2'
          }`}>
            {displayImageUrls.map((url, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openImageViewer(imageUrls, index)}
              >
                <AspectRatio ratio={2/3}>
                  <img 
                    src={url} 
                    alt="Media from post content" 
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => handleImageError(url)}
                  />
                </AspectRatio>
              </div>
            ))}
          </div>
        )}
        
        {hasMoreImages && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAllMedia(true)}
            className="mt-2 flex items-center"
          >
            <Image className="mr-2 h-4 w-4" />
            <span>See all {imageUrls.length} images</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
        
        {videoUrls.map((url, index) => (
          <div key={`video-${index}`} className="mt-3 rounded-md overflow-hidden shadow-sm">
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
        ))}
      </div>
    );
  };
  
  const renderPrimaryMedia = () => {
    if (!post || !post.mediaUrl) return null;
    
    if (post.mediaType === 'image' && !imageErrors[post.mediaUrl]) {
      return (
        <div 
          className="mt-3 relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => openImageViewer([post.mediaUrl!], 0)}
        >
          <AspectRatio ratio={2/3} className="max-w-md mx-auto">
            <img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="h-full w-full object-cover" 
              loading="lazy"
              onError={() => handleImageError(post.mediaUrl!)}
            />
          </AspectRatio>
        </div>
      );
    }
    
    if (post.mediaType === 'video') {
      return (
        <div className="mt-3 rounded-md overflow-hidden shadow-sm">
          <video 
            src={post.mediaUrl} 
            controls 
            className="rounded-md w-full max-h-80" 
            onError={(e) => {
              console.log(`Error loading video: ${post.mediaUrl}`);
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    return null;
  };

  const renderBookInfo = () => {
    if (!post || !post.taggedBook) return null;
    
    return (
      <Link to={`/book/${post.taggedBook.isbn}`} className="block">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 rounded-lg mt-3 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-100 dark:border-indigo-900">
          <div className="flex-shrink-0 w-12 h-18 relative">
            <BookCover 
              coverUrl={post.taggedBook.coverUrl} 
              title={post.taggedBook.title} 
              size="xsmall" 
            />
            <div className="absolute -bottom-1 -right-1 bg-indigo-100 dark:bg-indigo-800 rounded-full p-1 shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-300" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-0.5 flex items-center">
              Tagged Book
            </div>
            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{post.taggedBook.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ISBN: {post.taggedBook.isbn}</p>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-32" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-1" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-xl font-semibold mb-2">
                {error || "Post not found"}
              </h1>
              <p className="text-muted-foreground mb-6">
                The post you're looking for doesn't seem to exist or couldn't be loaded.
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const contentHasMedia = post.content && extractMediaUrls(post.content).length > 0;
  const authorName = post.author?.name || formatPubkey(post.pubkey);

  const renderContent = () => {
    if (post.isSpoiler && !spoilerRevealed) {
      return (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-md text-center">
          <p className="text-amber-700 dark:text-amber-400 mb-2">
            This post contains spoilers
            {post.taggedBook && ` for "${post.taggedBook.title}"`}
          </p>
          <Button variant="outline" size="sm" onClick={() => setSpoilerRevealed(true)} 
            className="bg-white dark:bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700">
            <Eye className="mr-1 h-4 w-4 text-amber-600 dark:text-amber-500" />
            <span className="text-amber-700 dark:text-amber-400">Reveal Content</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap break-words overflow-hidden">
          {linkifyText(post.content, contentHasMedia || !!post.mediaUrl)}
        </div>
        
        {renderPrimaryMedia()}
        {detectAndRenderMediaUrls(post.content)}
        {post.taggedBook && renderBookInfo()}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.picture} />
                  <AvatarFallback>
                    {authorName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link 
                    to={`/user/${post.pubkey}`} 
                    className="font-medium hover:underline"
                  >
                    {authorName}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {post.createdAt && (
                      <time dateTime={new Date(post.createdAt).toISOString()}>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </time>
                    )}
                  </div>
                </div>
              </div>
              
              {post.isSpoiler && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full text-xs border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Spoiler</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {renderContent()}
          </CardContent>
          
          <CardFooter className="pt-4 flex-col items-start">
            <RepliesSection 
              eventId={post.id}
              authorPubkey={post.pubkey}
              initialReplies={post.replies}
              onReaction={handleReaction}
            />
          </CardFooter>
        </Card>
      </div>
      
      <ImageViewerModal
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        images={viewerImages}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />
    </Layout>
  );
};

export default PostDetail;