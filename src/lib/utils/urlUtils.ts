/**
 * URL pattern to match URLs in text
 * This matches URLs starting with http:// or https:// or www.
 */
export const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+)/gi;

/**
 * Media URL pattern to match image and video URLs
 */
export const MEDIA_URL_PATTERN = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|mov|webm))/gi;

/**
 * Checks if a URL is a media URL (image or video)
 */
export const isMediaUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i.test(url);
};

/**
 * Extracts all URLs from text
 */
export const extractUrls = (text: string): string[] => {
  return text.match(URL_PATTERN) || [];
};

/**
 * Extracts all media URLs from text
 */
export const extractMediaUrls = (text: string): string[] => {
  return text.match(MEDIA_URL_PATTERN) || [];
};

/**
 * Removes media URLs from text
 */
export const removeMediaUrls = (text: string): string => {
  return text.replace(MEDIA_URL_PATTERN, '');
};

/**
 * Converts URLs in text to clickable links while preserving the rest of the text
 */
export const linkifyText = (text: string, removeMedia: boolean = false): React.ReactNode => {
  if (!text) return null;
  
  // First, if we need to remove media URLs, do that
  const processedText = removeMedia ? removeMediaUrls(text) : text;
  
  // Split the text by URL_PATTERN
  const parts = processedText.split(URL_PATTERN);
  
  // Match all URLs
  const urls = processedText.match(URL_PATTERN) || [];
  
  // If no URLs found, return the text as is
  if (urls.length === 0) {
    return processedText;
  }
  
  // Build the result by alternating between text and URL links
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, index) => {
    // Add the text part
    if (part) {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
    
    // Add the URL part (if there is one for this index)
    if (index < urls.length) {
      const url = urls[index];
      
      // Skip media URLs if we're keeping them separate
      if (removeMedia && isMediaUrl(url)) {
        return;
      }
      
      // Format the URL for display
      let displayUrl = url;
      if (displayUrl.length > 50) {
        displayUrl = displayUrl.substring(0, 47) + '...';
      }
      
      // Ensure URL has http/https prefix for the href
      const hrefUrl = url.startsWith('www.') ? `https://${url}` : url;
      
      result.push(
        <a 
          key={`url-${index}`}
          href={hrefUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {displayUrl}
        </a>
      );
    }
  });
  
  return result;
};
