
import React from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { CompactSocialFeed } from "@/components/CompactSocialFeed";
import { isLoggedIn } from "@/lib/nostr";
import { CreatePostBox } from "@/components/post/CreatePostBox";
import { Card } from "@/components/ui/card";

export function SocialSection() {
  if (!isLoggedIn()) {
    return (
      <section className="py-8 bg-bookverse-paper">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Reading Community
            </h2>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">Connect with other readers</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to see what books your friends are reading and share your own reading journey.
              </p>
              <Link 
                to="/library" 
                className="bg-bookverse-accent text-white px-4 py-2 rounded-md inline-block hover:bg-bookverse-accent/90"
              >
                Sign In
              </Link>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-bookverse-paper">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Global Activity
            </h2>
            <Link to="/social" className="text-sm text-bookverse-accent hover:underline">
              View All
            </Link>
          </div>
          
          <div className="mb-6">
            <CreatePostBox />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CompactSocialFeed maxItems={5} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold font-serif mb-4">Reading Community</h3>
              <p className="text-muted-foreground mb-4">
                See what readers around the world are sharing on the decentralized Nostr network.
              </p>
              <div className="space-y-2">
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Discover trending books and reviews</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Join conversations about your favorite books</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Share your own reading journey</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
