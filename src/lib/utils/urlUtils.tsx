import React from 'react';

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
  
  // If no URLs found, return the text as is
  const urls = processedText.match(URL_PATTERN);
  if (!urls || urls.length === 0) {
    return processedText;
  }
  
  // Build the result array with text and links properly alternating
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Use a regular expression with the global flag to find all matches
  const regex = new RegExp(URL_PATTERN);
  let match;
  
  // Reset regex lastIndex
  regex.lastIndex = 0;
  
  // Find all matches and their positions
  while ((match = regex.exec(processedText)) !== null) {
    const url = match[0];
    const matchIndex = match.index;
    
    // Skip media URLs if we're keeping them separate
    if (removeMedia && isMediaUrl(url)) {
      continue;
    }
    
    // Add text before the URL
    if (matchIndex > lastIndex) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {processedText.substring(lastIndex, matchIndex)}
        </span>
      );
    }
    
    // Format the URL for display
    let displayUrl = url;
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }
    
    // Ensure URL has http/https prefix for the href
    const hrefUrl = url.startsWith('www.') ? `https://${url}` : url;
    
    // Add the URL link
    result.push(
      <a 
        key={`url-${matchIndex}`}
        href={hrefUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {displayUrl}
      </a>
    );
    
    // Update lastIndex for next iteration
    lastIndex = matchIndex + url.length;
  }
  
  // Add any remaining text after the last URL
  if (lastIndex < processedText.length) {
    result.push(
      <span key={`text-${lastIndex}`}>
        {processedText.substring(lastIndex)}
      </span>
    );
  }
  
  return result.length > 0 ? result : processedText;
};
