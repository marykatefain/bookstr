
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface FeedErrorStateProps {
  error: Error;
  onRetry: () => void;
  isConnectionIssue?: boolean;
}

export function FeedErrorState({ error, onRetry, isConnectionIssue = false }: FeedErrorStateProps) {
  return (
    <Card className="p-6 flex flex-col items-center text-center">
      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-3 mb-4">
        {isConnectionIssue ? (
          <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-500" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
        )}
      </div>
      
      <h3 className="text-lg font-medium mb-2">
        {isConnectionIssue ? "Connection Issue" : "Something went wrong"}
      </h3>
      
      <p className="text-muted-foreground mb-4 max-w-md">
        {isConnectionIssue 
          ? "We're having trouble connecting to the Nostr network. This might be due to network issues or relay availability."
          : "We couldn't load the latest posts. This might be a temporary issue."}
      </p>
      
      <Button 
        onClick={onRetry} 
        className="bg-bookverse-accent hover:bg-bookverse-highlight mt-2"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
      
      {isConnectionIssue && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 w-full">
          <h4 className="text-sm font-medium mb-2">Connection tips:</h4>
          <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
            <li>Check your internet connection</li>
            <li>Try again in a few moments</li>
            <li>You can add additional relays in the Settings</li>
          </ul>
        </div>
      )}
    </Card>
  );
}
