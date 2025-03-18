
import React from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { CompactSocialFeed } from "@/components/CompactSocialFeed";
import { isLoggedIn } from "@/lib/nostr";

export function SocialSection() {
  if (!isLoggedIn()) {
    return null;
  }

  return (
    <section className="py-8 bg-bookverse-paper">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-bookverse-ink flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Reading Community
            </h2>
            <Link to="/social" className="text-sm text-bookverse-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CompactSocialFeed maxItems={5} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold font-serif mb-4">Reading Together</h3>
              <p className="text-muted-foreground mb-4">
                Connect with friends and discover what they're reading on the decentralized Nostr network.
              </p>
              <div className="space-y-2">
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Follow your friends and favorite readers</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Discover new books through recommendations</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                  <span>Share your thoughts and ratings</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
