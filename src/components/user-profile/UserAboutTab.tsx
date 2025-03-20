
import React from "react";
import { NostrProfile } from "@/lib/nostr/types";

interface UserAboutTabProps {
  profile: NostrProfile;
}

export const UserAboutTab: React.FC<UserAboutTabProps> = ({ profile }) => {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">About</h2>
      
      {profile.about ? (
        <p className="text-muted-foreground whitespace-pre-wrap">{profile.about}</p>
      ) : (
        <p className="text-muted-foreground">No bio available.</p>
      )}
      
      {profile.website && (
        <div>
          <h3 className="font-medium mt-4">Website</h3>
          <a 
            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-bookverse-accent hover:underline"
          >
            {profile.website}
          </a>
        </div>
      )}
    </div>
  );
};
